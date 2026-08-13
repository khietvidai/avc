/** Render the branded 404 page without changing the URL, as HTTP 404. */
export async function rewriteNotFound(
	astro: { rewrite: (path: string) => Promise<Response> },
	path: "/404" | "/vi/404",
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
