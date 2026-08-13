import type { APIRoute } from "astro";
import { publicOrigin } from "../utils/site-url";

export const GET: APIRoute = ({ url }) => {
	const origin = publicOrigin(url);
	const body = `User-agent: *
Allow: /
Disallow: /_emdash/

Sitemap: ${origin}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=86400",
		},
	});
};
