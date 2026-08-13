import { defineMiddleware } from "astro:middleware";

/** Legacy /en/... bookmarks → unprefixed English URLs. */
export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;

	if (pathname === "/en" || pathname === "/en/") {
		return context.redirect("/", 302);
	}
	if (pathname.startsWith("/en/")) {
		return context.redirect(pathname.slice(3) || "/", 302);
	}

	if (
		pathname === "/" ||
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
	if (first === "posts" && !rest[0]) {
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
