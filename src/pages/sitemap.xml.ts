import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { CATEGORY_TO_EN, enProjectSlug } from "../utils/i18n-routes";
import { publicOrigin } from "../utils/site-url";

const STATIC_EN = ["/", "/about", "/services", "/products", "/contact", "/portfolio"];
const STATIC_VI = [
	"/vi/",
	"/vi/gioi-thieu",
	"/vi/dich-vu",
	"/vi/san-pham",
	"/vi/lien-he",
	"/vi/portfolio",
	"/vi/posts",
];

function loc(origin: string, path: string, lastmod?: Date | string | null) {
	const last = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "";
	return `  <url><loc>${origin}${path}</loc>${last}</url>`;
}

export const GET: APIRoute = async ({ url }) => {
	const origin = publicOrigin(url);

	const { entries: posts } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		locale: "vi",
		limit: 200,
	});

	const urls = [
		...STATIC_EN.map((p) => loc(origin, p)),
		...STATIC_VI.map((p) => loc(origin, p)),
		...Object.values(CATEGORY_TO_EN).map((slug) => loc(origin, `/category/${slug}`)),
		...Object.keys(CATEGORY_TO_EN).map((slug) => loc(origin, `/vi/category/${slug}`)),
		...posts.flatMap((p) => [
			loc(origin, `/projects/${enProjectSlug(p.id)}`, p.data.updatedAt ?? p.data.publishedAt),
			loc(origin, `/vi/posts/${p.id}`, p.data.updatedAt ?? p.data.publishedAt),
		]),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
