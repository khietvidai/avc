import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { CATEGORY_TO_EN, enProjectSlug, viProjectPath } from "../utils/i18n-routes";
import { publicOrigin } from "../utils/site-url";

const STATIC_PAIRS: Array<[string, string]> = [
	["/", "/vi/"],
	["/about", "/vi/gioi-thieu"],
	["/services", "/vi/dich-vu"],
	["/products", "/vi/san-pham"],
	["/contact", "/vi/lien-he"],
	["/portfolio", "/vi/portfolio"],
	["/search", "/vi/search"],
];

function urlEntry(origin: string, locPath: string, enPath: string, viPath: string, lastmod?: Date | string | null) {
	const last = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "";
	return `  <url>
    <loc>${origin}${locPath}</loc>${last}
    <xhtml:link rel="alternate" hreflang="en" href="${origin}${enPath}"/>
    <xhtml:link rel="alternate" hreflang="vi" href="${origin}${viPath}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${enPath}"/>
  </url>`;
}

function pair(origin: string, enPath: string, viPath: string, lastmod?: Date | string | null) {
	return [
		urlEntry(origin, enPath, enPath, viPath, lastmod),
		urlEntry(origin, viPath, enPath, viPath, lastmod),
	];
}

export const GET: APIRoute = async ({ url }) => {
	const origin = publicOrigin(url);

	const { entries: posts } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		locale: "vi",
		limit: 200,
	});

	const urls = [
		...STATIC_PAIRS.flatMap(([en, vi]) => pair(origin, en, vi)),
		urlEntry(origin, "/vi/posts", "/portfolio", "/vi/posts"),
		...Object.entries(CATEGORY_TO_EN).flatMap(([viSlug, enSlug]) =>
			pair(origin, `/category/${enSlug}`, `/vi/category/${viSlug}`),
		),
		...posts.flatMap((p) =>
			pair(
				origin,
				`/projects/${enProjectSlug(p.id)}`,
				viProjectPath(p.id),
				p.data.updatedAt ?? p.data.publishedAt,
			),
		),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
