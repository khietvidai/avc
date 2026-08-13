/** Flatten Portable Text (or a string) into plain paragraphs. */
export function portableTextToParagraphs(value: unknown): string[] {
	if (typeof value === "string") {
		return value
			.split(/\n+/)
			.map((s) => s.trim())
			.filter(Boolean);
	}
	if (!Array.isArray(value)) return [];
	const out: string[] = [];
	for (const block of value) {
		if (!block || typeof block !== "object") continue;
		const rec = block as Record<string, unknown>;
		if (rec._type === "block" && Array.isArray(rec.children)) {
			const text = rec.children
				.map((child) =>
					child && typeof child === "object" && "text" in child
						? String((child as { text?: unknown }).text ?? "")
						: "",
				)
				.join("")
				.trim();
			if (text) out.push(text);
		}
	}
	return out;
}

export function portableTextToPlain(value: unknown): string {
	return portableTextToParagraphs(value).join("\n\n");
}

export function paragraphsToPortableText(paragraphs: string[]): unknown[] {
	return paragraphs
		.map((text) => text.trim())
		.filter(Boolean)
		.map((text) => ({
			_type: "block",
			style: "normal",
			markDefs: [],
			children: [{ _type: "span", text, marks: [] }],
		}));
}

export function contentHash(parts: Array<string | undefined | null>): string {
	const raw = parts.map((p) => (p ?? "").trim()).join("\u001f");
	let h = 2166136261;
	for (let i = 0; i < raw.length; i++) {
		h ^= raw.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(16);
}
