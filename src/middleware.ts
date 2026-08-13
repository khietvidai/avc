import { defineMiddleware } from "astro:middleware";

/** Old unprefixed Vietnamese URLs → English (default) when a twin exists. */
const EN_PAGES = new Set([
	"gioi-thieu",
	"dich-vu",
	"san-pham",
	"lien-he",
	"portfolio",
]);

export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;
	if (
		pathname === "/" ||
		pathname.startsWith("/en") ||
		pathname.startsWith("/vi") ||
		pathname.startsWith("/_") ||
		pathname.startsWith("/rss") ||
		pathname.startsWith("/favicon") ||
		pathname.startsWith("/apple-touch") ||
		pathname.startsWith("/images/")
	) {
		return next();
	}

	const [first, ...rest] = pathname.replace(/^\//, "").split("/");
	if (!first) return next();

	if (EN_PAGES.has(first) && rest.length === 0) {
		return context.redirect(`/en/${first}`, 302);
	}
	if (first === "category" && rest[0]) {
		return context.redirect(`/en/category/${rest[0]}`, 302);
	}
	if (first === "posts" && rest[0]) {
		return context.redirect(`/en/posts/${rest[0]}`, 302);
	}
	if (first === "posts") {
		return context.redirect("/vi/posts", 302);
	}
	if (first === "search") {
		return context.redirect("/vi/search" + context.url.search, 302);
	}
	if (first === "tag" && rest[0]) {
		return context.redirect(`/vi/tag/${rest[0]}`, 302);
	}

	return next();
});
