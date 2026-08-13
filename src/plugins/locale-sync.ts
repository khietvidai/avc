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

const LOCALES = ["en", "vi"] as const;
const COLLECTIONS = ["posts", "linh_vuc", "home", "pages"] as const;

export function localeSyncPlugin(): PluginDescriptor {
	return {
		id: "locale-sync",
		version: "1.0.0",
		entrypoint: "./src/plugins/locale-sync.ts",
		capabilities: ["content:read", "content:write"],
		adminPages: [{ path: "/", label: "Đồng bộ EN/VI", icon: "translate" }],
	};
}

export function createPlugin() {
	return definePlugin({
		id: "locale-sync",
		version: "1.0.0",
		capabilities: ["content:read", "content:write"],
		routes: {
			admin: {
				handler: async (ctx) => {
					const interaction = ctx.input as { type?: string; action_id?: string };
					let last: SyncReport | null = null;
					if (interaction?.type === "block_action" && interaction.action_id === "sync") {
						last = await runSync(ctx.request);
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
			text: "Admin lọc theo locale. Bài chỉ có tiếng Việt sẽ không hiện khi chọn EN (default). Nút dưới tạo bản dịch còn thiếu (cùng slug, ảnh, nhóm dịch).",
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
						text: "Tạo bản dịch còn thiếu. Không ghi đè bài đã có.",
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
			text: "Sau khi đồng bộ: mở Dự án → chọn EN (default) để sửa tiêu đề / nội dung tiếng Anh. Ảnh và gallery được copy từ bản nguồn.",
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

async function runSync(request: Request): Promise<SyncReport> {
	const report: SyncReport = { created: 0, skipped: 0, errors: [], missing: [] };
	for (const collection of COLLECTIONS) {
		const unpaired = await findUnpaired(request, collection);
		for (const item of unpaired) {
			try {
				await createTranslation(request, collection, item.sourceId, item.to, item.slug, item.data);
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
): Promise<void> {
	const data = shapeData(collection, slug, targetLocale, sourceData);
	const created = await api(request, `/_emdash/api/content/${collection}`, {
		method: "POST",
		body: JSON.stringify({
			locale: targetLocale,
			translationOf: sourceId,
			slug,
			data,
		}),
	});
	const item = unwrapItem(created);
	if (!item?.id) throw new Error("Create returned no id");
	await api(request, `/_emdash/api/content/${collection}/${encodeURIComponent(item.id)}/publish`, {
		method: "POST",
		body: JSON.stringify({}),
	});
}

function shapeData(
	collection: string,
	slug: string,
	targetLocale: string,
	source: Record<string, unknown>,
): Record<string, unknown> {
	const data: Record<string, unknown> = { ...source };
	delete data.id;
	delete data.locale;
	delete data.slug;
	delete data.status;
	delete data.translation_group;
	delete data.translationGroup;

	if (targetLocale === "en" && collection === "posts") {
		const en = PROJECTS_EN[slug];
		if (en) {
			data.title = en.title;
			data.excerpt = en.excerpt;
			data.chu_dau_tu = en.client;
			data.dia_chi = en.location;
			data.content = en.body.map((text) => ({
				_type: "block",
				style: "normal",
				markDefs: [],
				children: [{ _type: "span", text, marks: [] }],
			}));
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


