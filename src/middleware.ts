import { defineMiddleware } from "astro:middleware";
import { toEnUrl } from "./utils/i18n-routes";
import { sanitizeHtmlResponse } from "./utils/html-w3c";
import { ADMIN_SEO_COUNTER_SCRIPT } from "./utils/admin-seo-counters";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	if (pathname === "/en" || pathname === "/en/") {
		return context.redirect("/", 302);
	}
	if (pathname.startsWith("/en/")) {
		return context.redirect(toEnUrl(pathname.slice(3) || "/"), 301);
	}

	const collapsed = pathname.replace(/^\/vi\/(posts|category)\/(?:vi|en)\//, "/vi/$1/");
	if (collapsed !== pathname) {
		return context.redirect(collapsed + context.url.search, 301);
	}

	if (
		!pathname.startsWith("/vi") &&
		!pathname.startsWith("/_") &&
		!pathname.startsWith("/rss") &&
		!pathname.startsWith("/favicon") &&
		!pathname.startsWith("/apple-touch") &&
		!pathname.startsWith("/images/")
	) {
		const english = toEnUrl(pathname);
		if (english !== pathname) {
			return context.redirect(english + context.url.search, 301);
		}
	}

	const response = await next();
	if (pathname.startsWith("/_emdash/admin")) {
		return injectAdminSeoCounters(response);
	}
	if (pathname.startsWith("/_")) return response;
	return sanitizeHtmlResponse(response);
});

async function injectAdminSeoCounters(response: Response): Promise<Response> {
	const type = response.headers.get("content-type") || "";
	if (!type.includes("text/html")) return response;
	const html = await response.text();
	if (!html.includes("</body>")) {
		return new Response(html, { status: response.status, headers: response.headers });
	}
	const next = html.replace(
		"</body>",
		`<script>${ADMIN_SEO_COUNTER_SCRIPT}</script></body>`,
	);
	const headers = new Headers(response.headers);
	headers.delete("content-length");
	return new Response(next, { status: response.status, headers });
}
