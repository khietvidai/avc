/** Render the branded 404 page without changing the URL, as HTTP 404.
 *  Always rewrite to /404 (not /vi/404) — Astro i18n treats /vi/404 as a
 *  fallback and 302s to the English page. Locale is passed as ?lang=vi. */
export async function rewriteNotFound(
	astro: { rewrite: (path: string) => Promise<Response> },
	path: "/404" | "/404?lang=vi",
): Promise<Response> {
	const res = await astro.rewrite(path);
	const headers = new Headers(res.headers);
	headers.delete("content-length");
	return new Response(res.body, {
		status: 404,
		statusText: "Not Found",
		headers,
	});
}
