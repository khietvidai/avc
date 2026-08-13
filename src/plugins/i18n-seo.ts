/**
 * After a Vietnamese project is published:
 *   1. Fill empty SEO title / description / OG image
 *   2. Create or refresh the English translation via DeepSeek
 *
 * Does not overwrite SEO fields the editor already typed.
 */
import type { PluginContext } from "emdash";
import { bareCmsId } from "../utils/i18n-routes";
import { translateProject } from "../utils/deepseek";
import { contentHash, paragraphsToPortableText, portableTextToPlain } from "../utils/pt-text";

const TRANSLATABLE = new Set(["posts", "linh_vuc", "home", "pages"]);

type HookContent = {
	id?: string;
	slug?: string | null;
	status?: string;
	locale?: string | null;
	data?: Record<string, unknown>;
	seo?: {
		title?: string | null;
		description?: string | null;
		image?: string | null;
		canonical?: string | null;
	};
};

function str(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function mediaId(value: unknown): string | null {
	if (typeof value === "string" && value) return value;
	if (value && typeof value === "object" && "id" in value) {
		const id = (value as { id?: unknown }).id;
		if (typeof id === "string" && id) return id;
	}
	return null;
}

async function resolveApiKey(ctx: PluginContext): Promise<string | null> {
	const fromKv = await ctx.kv.get<string>("settings:apiKey");
	if (fromKv && fromKv.trim()) return fromKv.trim();
	try {
		const mod = await import("cloudflare:workers");
		const env = (mod as { env?: Record<string, string | undefined> }).env;
		if (env?.DEEPSEEK_API_KEY) return env.DEEPSEEK_API_KEY;
	} catch {
		/* not on workers */
	}
	const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
		?.env;
	return proc?.DEEPSEEK_API_KEY?.trim() || null;
}

function extractFields(content: HookContent) {
	const data = content.data ?? (content as unknown as Record<string, unknown>);
	return {
		title: str(data.title),
		excerpt: str(data.excerpt),
		chu_dau_tu: str(data.chu_dau_tu),
		dia_chi: str(data.dia_chi),
		body: portableTextToPlain(data.content),
		featuredId: mediaId(data.featured_image),
	};
}

async function findBySlug(
	ctx: PluginContext,
	collection: string,
	slug: string,
	locale: string,
): Promise<{ id: string; seo?: HookContent["seo"]; data: Record<string, unknown> } | null> {
	if (!ctx.content) return null;
	let cursor: string | undefined;
	for (let i = 0; i < 8; i++) {
		const page = await ctx.content.list(collection, {
			limit: 100,
			cursor,
			where: { locale },
		});
		for (const item of page.items) {
			if (bareCmsId(item.slug ?? "") === slug) {
				return { id: item.id, seo: item.seo, data: item.data };
			}
		}
		if (!page.hasMore || !page.cursor) break;
		cursor = page.cursor;
	}
	return null;
}

export async function runI18nSeo(
	event: { content: Record<string, unknown>; collection: string },
	ctx: PluginContext,
	request?: Request,
): Promise<string> {
	if (!TRANSLATABLE.has(event.collection) || !ctx.content?.update) {
		return "skip";
	}

	const content = event.content as HookContent;
	const id = str(content.id);
	const locale = (content.locale || "en").toLowerCase();
	if (!id) return "no-id";

	const lockKey = `lock:${event.collection}:${id}`;
	const locked = await ctx.kv.get<number>(lockKey);
	if (locked && Date.now() - locked < 90_000) return "locked";
	await ctx.kv.set(lockKey, Date.now());

	const fields = extractFields(content);
	if (!fields.title) return "no-title";

	const hash = contentHash([fields.title, fields.excerpt, fields.chu_dau_tu, fields.dia_chi, fields.body]);
	const hashKey = `hash:${event.collection}:${id}`;
	const prev = await ctx.kv.get<string>(hashKey);

	const seo = content.seo ?? {};
	const needSeo = !str(seo.title) || !str(seo.description) || (!str(seo.image) && fields.featuredId);

	let translated = null as Awaited<ReturnType<typeof translateProject>> | null;
	const apiKey = await resolveApiKey(ctx);
	const shouldTranslate = locale === "vi" && event.collection === "posts" && prev !== hash;

	if (apiKey && (shouldTranslate || (needSeo && prev !== hash))) {
		translated = await translateProject({
			apiKey,
			title: fields.title,
			excerpt: fields.excerpt,
			chu_dau_tu: fields.chu_dau_tu,
			dia_chi: fields.dia_chi,
			body: fields.body,
		});
	}

	const seoTitle = str(seo.title) || translated?.vi.seoTitle || fields.title.slice(0, 60);
	const seoDesc =
		str(seo.description) || translated?.vi.seoDescription || (fields.excerpt || fields.title).slice(0, 160);
	const seoImage = str(seo.image) || fields.featuredId || null;

	if (needSeo) {
		await ctx.content.update(event.collection, id, {
			seo: {
				title: seoTitle,
				description: seoDesc,
				image: seoImage,
			},
		});
	}

	if (locale === "vi" && event.collection === "posts" && translated) {
		const slug = bareCmsId(str(content.slug) || fields.title);
		const enRow = await findBySlug(ctx, "posts", slug, "en");
		const enData = {
			title: translated.title,
			excerpt: translated.excerpt,
			chu_dau_tu: translated.chu_dau_tu || fields.chu_dau_tu,
			dia_chi: translated.dia_chi || fields.dia_chi,
			content: paragraphsToPortableText(translated.content.length ? translated.content : [translated.excerpt]),
			featured_image: content.data?.featured_image,
			slide_image: content.data?.slide_image,
			gallery: content.data?.gallery,
			nam_hoan_thanh: content.data?.nam_hoan_thanh,
			quy_mo: content.data?.quy_mo,
			seo: {
				title: translated.en.seoTitle,
				description: translated.en.seoDescription,
				image: seoImage,
			},
		};

		if (enRow && ctx.content.update) {
			await ctx.content.update("posts", enRow.id, enData);
		} else if (request) {
			await createEnViaApi(request, ctx, id, slug, enData);
		}
	}

	await ctx.kv.set(hashKey, hash);
	return translated ? "translated" : needSeo ? "seo" : "noop";
}

async function createEnViaApi(
	request: Request,
	ctx: PluginContext,
	sourceId: string,
	slug: string,
	data: Record<string, unknown>,
): Promise<void> {
	const origin = new URL(request.url).origin;
	const headers = new Headers({
		Accept: "application/json",
		"Content-Type": "application/json",
		"X-EmDash-Request": "1",
	});
	const cookie = request.headers.get("cookie");
	if (cookie) headers.set("Cookie", cookie);

	const created = await fetch(`${origin}/_emdash/api/content/posts`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			locale: "en",
			translationOf: sourceId,
			slug,
			data: Object.fromEntries(Object.entries(data).filter(([k]) => k !== "seo")),
			seo: data.seo,
		}),
	});
	if (!created.ok) {
		ctx.log.warn(`EN create failed ${created.status}: ${(await created.text()).slice(0, 180)}`);
		return;
	}
	const json = (await created.json()) as { data?: { item?: { id?: string } }; item?: { id?: string } };
	const newId = json.data?.item?.id ?? json.item?.id;
	if (!newId) return;
	await fetch(`${origin}/_emdash/api/content/posts/${encodeURIComponent(newId)}/publish`, {
		method: "POST",
		headers,
		body: "{}",
	});
}

export { resolveApiKey };
