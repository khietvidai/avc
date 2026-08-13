/**
 * Public site origin. Prefer PUBLIC_SITE_URL / SITE_URL when set
 * (custom domain). Otherwise use the request host so workers.dev and
 * a later custom domain both stay correct without code changes.
 */
export function publicOrigin(url: URL): string {
	const fromEnv =
		(typeof import.meta.env.PUBLIC_SITE_URL === "string" && import.meta.env.PUBLIC_SITE_URL) ||
		(typeof import.meta.env.SITE_URL === "string" && import.meta.env.SITE_URL) ||
		"";
	if (fromEnv) return fromEnv.replace(/\/+$/, "");
	return url.origin;
}

export function absolutize(origin: string, href?: string | null): string | null {
	if (!href) return null;
	if (/^https?:\/\//i.test(href)) return href;
	return origin + (href.startsWith("/") ? href : `/${href}`);
}

export function canonicalUrl(origin: string, pathname: string): string {
	const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
	return origin + path;
}
