/**
 * Locale Sync — keep EN and VI content rows paired in EmDash.
 *
 * Admin list is per-locale. Projects were created as VI only, so EN (default)
 * looks empty. This plugin creates the missing translation row (same slug,
 * shared translation_group) and copies images / shared fields.
 */
import type { PluginDescriptor } from "emdash";
import { definePlugin } from "emdash";
import { PROJECTS_EN } from "../utils/projects-en";
import { MARKET_LABEL_EN, bareCmsId } from "../utils/i18n-routes";
import { runI18nSeo, resolveApiKey } from "./i18n-seo";
import { translateProject } from "../utils/deepseek";
import { paragraphsToPortableText, portableTextToPlain } from "../utils/pt-text";

const LOCALES = ["en", "vi"] as const;
const COLLECTIONS = ["posts", "linh_vuc", "home", "pages"] as const;

export function localeSyncPlugin(): PluginDescriptor {
	return {
		id: "locale-sync",
		version: "1.1.0",
		entrypoint: "locale-sync",
		capabilities: ["content:read", "content:write", "network:request"],
		allowedHosts: ["api.deepseek.com"],
		adminPages: [{ path: "/", label: "Đồng bộ EN/VI", icon: "translate" }],
		settingsSchema: {
			apiKey: {
				type: "secret",
				label: "DeepSeek API Key",
				description: "Dùng để tự dịch dự án VI → EN và điền SEO Title / Meta Description.",
			},
		},
	};
}

export function createPlugin() {
	return definePlugin({
		id: "locale-sync",
		version: "1.1.0",
		capabilities: ["content:read", "content:write", "network:request"],
		hooks: {
			"content:afterPublish": {
				timeout: 90_000,
				errorPolicy: "continue",
				handler: async (event, ctx) => {
					try {
						const result = await runI18nSeo(event, ctx);
						ctx.log.info(`i18n-seo ${event.collection}/${String((event.content as { id?: string }).id)} → ${result}`);
					} catch (err) {
						ctx.log.warn(`i18n-seo failed: ${err instanceof Error ? err.message : err}`);
					}
				},
			},
			"content:afterSave": {
				timeout: 90_000,
				errorPolicy: "continue",
				handler: async (event, ctx) => {
					const status = String((event.content as { status?: string }).status ?? "");
					if (status !== "published") return;
					try {
						await runI18nSeo(event, ctx);
					} catch (err) {
						ctx.log.warn(`i18n-seo save failed: ${err instanceof Error ? err.message : err}`);
					}
				},
			},
		},
		routes: {
			admin: {
				handler: async (ctx) => {
					const interaction = ctx.input as { type?: string; action_id?: string };
					let last: SyncReport | null = null;
					if (interaction?.type === "block_action" && interaction.action_id === "sync") {
						last = await runSync(ctx.request, ctx);
					}
					const preview = last ?? (await previewMissing(ctx.request));
					return {
						blocks: pageBlocks(preview),
						toast: last
							? {
									message: `Đã tạo ${last.created} bản dịch, bỏ qua ${last.skipped}.`,
									type: last.errors.length ? "error" : "success",
								}
							: undefined,
					};
				},
			},
		},
	});
}

type SyncReport = {
	created: number;
	skipped: number;
	errors: string[];
	missing: { collection: string; slug: string; from: string; to: string }[];
};

function pageBlocks(report: SyncReport) {
	return [
		{ type: "header", text: "Đồng bộ EN ↔ VI" },
		{
			type: "section",
			text: "Đăng dự án tiếng Việt rồi Publish: SEO Title / Meta Description tự điền (50–60 / 140–160 ký tự). Bản EN được DeepSeek dịch khi bài EN đã có, hoặc khi bấm Đồng bộ (tạo bài còn thiếu).",
		},
		{
			type: "stats",
			stats: [
				{ label: "Thiếu bản dịch", value: String(report.missing.length) },
				{ label: "Vừa tạo", value: String(report.created) },
				{ label: "Lỗi", value: String(report.errors.length) },
			],
		},
		{
			type: "actions",
			elements: [
				{
					type: "button",
					text: "Đồng bộ tất cả",
					action_id: "sync",
					style: "primary",
					confirm: {
						title: "Đồng bộ EN và VI?",
						text: "Tạo bản dịch còn thiếu và dịch bằng DeepSeek. Không ghi đè bài EN đã có.",
						confirm: "Đồng bộ",
						deny: "Huỷ",
					},
				},
			],
		},
		...(report.missing.length
			? [
					{
						type: "table",
						columns: [
							{ key: "collection", label: "Loại" },
							{ key: "slug", label: "Slug" },
							{ key: "from", label: "Có" },
							{ key: "to", label: "Thiếu" },
						],
						rows: report.missing.slice(0, 40),
					},
				]
			: [{ type: "banner", title: "Đã đủ cặp EN/VI", variant: "default" }]),
		...(report.errors.length
			? [{ type: "banner", title: report.errors.slice(0, 5).join(" · "), variant: "error" }]
			: []),
		{
			type: "section",
			text: "Canonical URL để trống. Ảnh OG lấy từ ảnh đại diện nếu chưa chọn. Có thể dán DeepSeek key ở Settings của plugin nếu secret Wrangler chưa có.",
		},
	];
}

async function previewMissing(request: Request): Promise<SyncReport> {
	const missing: SyncReport["missing"] = [];
	for (const collection of COLLECTIONS) {
		const pairs = await findUnpaired(request, collection);
		for (const p of pairs) missing.push({ collection, ...p });
	}
	return { created: 0, skipped: 0, errors: [], missing };
}

async function runSync(request: Request, pluginCtx?: { kv?: { get: <T>(k: string) => Promise<T | null> } }): Promise<SyncReport> {
	const report: SyncReport = { created: 0, skipped: 0, errors: [], missing: [] };
	const apiKey = pluginCtx ? await resolveApiKey(pluginCtx as never) : null;
	for (const collection of COLLECTIONS) {
		const unpaired = await findUnpaired(request, collection);
		for (const item of unpaired) {
			try {
				await createTranslation(request, collection, item.sourceId, item.to, item.slug, item.data, apiKey);
				report.created++;
			} catch (err) {
				report.errors.push(`${collection}/${item.slug}: ${err instanceof Error ? err.message : err}`);
			}
		}
		report.skipped += Math.max(0, 0);
	}
	const after = await previewMissing(request);
	report.missing = after.missing;
	return report;
}

type Unpaired = {
	sourceId: string;
	slug: string;
	from: string;
	to: string;
	data: Record<string, unknown>;
};

async function findUnpaired(request: Request, collection: string): Promise<Unpaired[]> {
	const out: Unpaired[] = [];
	const byLocale: Record<string, { id: string; slug: string; data: Record<string, unknown> }[]> = {
		en: [],
		vi: [],
	};
	for (const locale of LOCALES) {
		const json = await api(request, `/_emdash/api/content/${collection}?locale=${locale}&limit=200`);
		for (const row of listItems(json)) {
			const slug = bareCmsId(String(row.slug ?? row.data?.slug ?? row.id));
			byLocale[locale].push({ id: String(row.id), slug, data: (row.data ?? row) as Record<string, unknown> });
		}
	}
	const slugsEn = new Set(byLocale.en.map((r) => r.slug));
	const slugsVi = new Set(byLocale.vi.map((r) => r.slug));
	for (const row of byLocale.vi) {
		if (!slugsEn.has(row.slug)) {
			out.push({ sourceId: row.id, slug: row.slug, from: "VI", to: "en", data: row.data });
		}
	}
	for (const row of byLocale.en) {
		if (!slugsVi.has(row.slug)) {
			out.push({ sourceId: row.id, slug: row.slug, from: "EN", to: "vi", data: row.data });
		}
	}
	return out;
}

async function createTranslation(
	request: Request,
	collection: string,
	sourceId: string,
	targetLocale: string,
	slug: string,
	sourceData: Record<string, unknown>,
	apiKey?: string | null,
): Promise<void> {
	const data = await shapeData(collection, slug, targetLocale, sourceData, apiKey);
	const title = typeof data.title === "string" ? data.title : "";
	const excerpt = typeof data.excerpt === "string" ? data.excerpt : "";
	const created = await api(request, `/_emdash/api/content/${collection}`, {
		method: "POST",
		body: JSON.stringify({
			locale: targetLocale,
			translationOf: sourceId,
			slug,
			data,
			seo: {
				title: title.slice(0, 60),
				description: (excerpt || title).slice(0, 160),
			},
		}),
	});
	const item = unwrapItem(created);
	if (!item?.id) throw new Error("Create returned no id");
	await api(request, `/_emdash/api/content/${collection}/${encodeURIComponent(item.id)}/publish`, {
		method: "POST",
		body: JSON.stringify({}),
	});
}

async function shapeData(
	collection: string,
	slug: string,
	targetLocale: string,
	source: Record<string, unknown>,
	apiKey?: string | null,
): Promise<Record<string, unknown>> {
	const data: Record<string, unknown> = { ...source };
	delete data.id;
	delete data.locale;
	delete data.slug;
	delete data.status;
	delete data.translation_group;
	delete data.translationGroup;
	delete data.seo;

	if (targetLocale === "en" && collection === "posts") {
		const en = PROJECTS_EN[slug];
		if (en) {
			data.title = en.title;
			data.excerpt = en.excerpt;
			data.chu_dau_tu = en.client;
			data.dia_chi = en.location;
			data.content = paragraphsToPortableText(en.body);
		} else if (apiKey) {
			const tr = await translateProject({
				apiKey,
				title: String(source.title ?? ""),
				excerpt: String(source.excerpt ?? ""),
				chu_dau_tu: String(source.chu_dau_tu ?? ""),
				dia_chi: String(source.dia_chi ?? ""),
				body: portableTextToPlain(source.content),
			});
			data.title = tr.title;
			data.excerpt = tr.excerpt;
			data.chu_dau_tu = tr.chu_dau_tu || source.chu_dau_tu;
			data.dia_chi = tr.dia_chi || source.dia_chi;
			data.content = paragraphsToPortableText(tr.content.length ? tr.content : [tr.excerpt]);
		}
	}
	if (targetLocale === "en" && collection === "linh_vuc") {
		const label = MARKET_LABEL_EN[slug];
		if (label) data.title = label;
	}
	return data;
}

async function api(request: Request, path: string, init: RequestInit = {}): Promise<unknown> {
	const url = new URL(path, request.url);
	const headers = new Headers(init.headers);
	headers.set("X-EmDash-Request", "1");
	headers.set("Accept", "application/json");
	const cookie = request.headers.get("cookie");
	if (cookie) headers.set("Cookie", cookie);
	if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
	const res = await fetch(url, { ...init, headers });
	const text = await res.text();
	let json: unknown = {};
	try {
		json = text ? JSON.parse(text) : {};
	} catch {
		json = { raw: text };
	}
	if (!res.ok) {
		const msg =
			(typeof json === "object" && json && "error" in json && JSON.stringify((json as { error: unknown }).error)) ||
			text ||
			res.statusText;
		throw new Error(`${res.status} ${msg}`.slice(0, 240));
	}
	return json;
}

function listItems(json: unknown): Array<Record<string, unknown>> {
	if (!json || typeof json !== "object") return [];
	const o = json as Record<string, unknown>;
	const data = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : o;
	const items = data.items ?? o.items;
	return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

function unwrapItem(json: unknown): (Record<string, unknown> & { id?: string; data?: Record<string, unknown> }) | null {
	if (!json || typeof json !== "object") return null;
	const o = json as Record<string, unknown>;
	const data = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : o;
	const item = (data.item ?? o.item ?? data) as Record<string, unknown>;
	return item && typeof item === "object" ? item : null;
}


