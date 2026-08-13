/**
 * Astro's Image stylesheet and SSR script injection fail the W3C Nu HTML
 * checker. Rewrite the finished HTML so public pages validate.
 */
export function sanitizeHtmlForW3c(html: string): string {
	let out = html;

	// Invalid object-position pairings in @layer astro.images
	// (top/bottom together, left/right together). Unused by the site.
	out = out.replace(
		/\[data-astro-image-pos=(?:top-bottom|bottom-top|left-right|right-left)\]\{object-position:[^}]+\}/g,
		"",
	);

	// Footer widget title is a hidden h3 — on pages whose last heading is
	// h1 (portfolio, category) that skips a level. It is already display:none.
	out = out.replace(
		/<h3(\s+class="widget__title"[^>]*)>([\s\S]*?)<\/h3>/g,
		"<p$1>$2</p>",
	);

	// Bundled Astro <script> tags are appended after </html> in this SSR
	// adapter. Move them back inside <body>.
	const htmlClose = out.lastIndexOf("</html>");
	if (htmlClose !== -1) {
		const after = out.slice(htmlClose + "</html>".length);
		if (after.trim()) {
			const before = out.slice(0, htmlClose);
			const bodyClose = before.lastIndexOf("</body>");
			if (bodyClose !== -1) {
				out =
					before.slice(0, bodyClose) +
					after +
					before.slice(bodyClose) +
					"</html>";
			} else {
				out = before + after + "</html>";
			}
		}
	}

	return out;
}

export async function sanitizeHtmlResponse(response: Response): Promise<Response> {
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("text/html") || !response.body) {
		return response;
	}

	const html = await response.text();
	const cleaned = sanitizeHtmlForW3c(html);
	if (cleaned === html) return new Response(html, response);

	const headers = new Headers(response.headers);
	headers.delete("content-length");
	return new Response(cleaned, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
