import { defineMiddleware } from "astro:middleware";
import { toEnUrl } from "./utils/i18n-routes";

export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;

	if (pathname === "/en" || pathname === "/en/") {
		return context.redirect("/", 302);
	}
	if (pathname.startsWith("/en/")) {
		return context.redirect(toEnUrl(pathname.slice(3) || "/"), 301);
	}

	if (
		pathname.startsWith("/vi") ||
		pathname.startsWith("/_") ||
		pathname.startsWith("/rss") ||
		pathname.startsWith("/favicon") ||
		pathname.startsWith("/apple-touch") ||
		pathname.startsWith("/images/")
	) {
		return next();
	}

	const english = toEnUrl(pathname);
	if (english !== pathname) {
		return context.redirect(english + context.url.search, 301);
	}

	return next();
});
