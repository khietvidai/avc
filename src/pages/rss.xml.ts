import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";

import { enProjectSlug } from "../utils/i18n-routes";
import { projectEn } from "../utils/projects-en";
import { publicOrigin } from "../utils/site-url";

export const GET: APIRoute = async ({ url }) => {
	const siteUrl = publicOrigin(url);
	const siteTitle = "AVC Industrial Equipment Co., Ltd";
	const siteTagline =
		"Turnkey commercial kitchen solutions in Vietnam — consulting, design, equipment supply, installation and maintenance";

	const { entries: posts } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 50,
		locale: "vi",
	});

	const items = posts
		.map((post) => {
			if (!post.data.publishedAt) return null;
			const pubDate = post.data.publishedAt.toUTCString();
			const en = projectEn(post.id);

			const postUrl = `${siteUrl}/projects/${enProjectSlug(post.id)}`;
			const title = escapeXml(en?.title || post.data.title || "Untitled project");
			const description = escapeXml(en?.excerpt || post.data.excerpt || "");

			return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
		})
		.filter(Boolean)
		.join("\n");

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteTagline)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
