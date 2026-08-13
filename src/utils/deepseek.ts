export const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
export const DEEPSEEK_MODEL = "deepseek-v4-pro";

export type LocaleSeo = {
	seoTitle: string;
	seoDescription: string;
};

export type ProjectTranslation = {
	title: string;
	excerpt: string;
	chu_dau_tu: string;
	dia_chi: string;
	content: string[];
	en: LocaleSeo;
	vi: LocaleSeo;
};

export async function deepseekComplete(opts: {
	apiKey: string;
	system: string;
	user: string;
	timeoutMs?: number;
}): Promise<string> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 55_000);
	try {
		const res = await fetch(DEEPSEEK_URL, {
			method: "POST",
			signal: ctrl.signal,
			headers: {
				Authorization: `Bearer ${opts.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: DEEPSEEK_MODEL,
				stream: false,
				response_format: { type: "json_object" },
				messages: [
					{ role: "system", content: opts.system },
					{ role: "user", content: opts.user },
				],
			}),
		});
		const text = await res.text();
		if (!res.ok) {
			throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 220)}`);
		}
		const json = JSON.parse(text) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = json.choices?.[0]?.message?.content;
		if (!content) throw new Error("DeepSeek returned empty content");
		return content;
	} finally {
		clearTimeout(timer);
	}
}

function clip(value: string, max: number): string {
	const t = value.replace(/\s+/g, " ").trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max - 1);
	const sp = cut.lastIndexOf(" ");
	return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

function asString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

export function parseProjectTranslation(raw: string): ProjectTranslation {
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	const json = JSON.parse(start >= 0 ? raw.slice(start, end + 1) : raw) as Record<string, unknown>;
	const enSeo = (json.en && typeof json.en === "object" ? json.en : json) as Record<string, unknown>;
	const viSeo = (json.vi && typeof json.vi === "object" ? json.vi : json) as Record<string, unknown>;
	const content = Array.isArray(json.content)
		? json.content.map((p) => String(p).trim()).filter(Boolean)
		: asString(json.body || json.excerpt)
			? [asString(json.body || json.excerpt)]
			: [];
	return {
		title: asString(json.title),
		excerpt: asString(json.excerpt),
		chu_dau_tu: asString(json.chu_dau_tu ?? json.client),
		dia_chi: asString(json.dia_chi ?? json.location),
		content,
		en: {
			seoTitle: clip(asString(enSeo.seoTitle ?? json.enSeoTitle), 60),
			seoDescription: clip(asString(enSeo.seoDescription ?? json.enSeoDescription), 160),
		},
		vi: {
			seoTitle: clip(asString(viSeo.seoTitle ?? json.viSeoTitle), 60),
			seoDescription: clip(asString(viSeo.seoDescription ?? json.viSeoDescription), 160),
		},
	};
}

export async function translateProject(opts: {
	apiKey: string;
	title: string;
	excerpt: string;
	chu_dau_tu: string;
	dia_chi: string;
	body: string;
}): Promise<ProjectTranslation> {
	const system = `You are the bilingual SEO editor for AVC Industrial Equipment Co., Ltd (Công ty TNHH Thiết Bị Công Nghiệp AVC), a Vietnam commercial-kitchen contractor.
Return ONLY valid JSON. No markdown.
Write natural hospitality English (not keyword stuffing). Vietnamese SEO must stay formal and clear.
SEO title: 50–60 characters, include the project name, no trailing site name.
SEO description: 140–160 characters, one sentence on what AVC delivered.`;

	const user = JSON.stringify({
		task: "Translate this published kitchen project VI→EN and write SEO for both locales.",
		source: {
			title: opts.title,
			excerpt: opts.excerpt,
			chu_dau_tu: opts.chu_dau_tu,
			dia_chi: opts.dia_chi,
			body: opts.body.slice(0, 6000),
		},
		json_shape: {
			title: "English project title",
			excerpt: "English 1–2 sentence summary",
			chu_dau_tu: "English client name",
			dia_chi: "English address",
			content: ["English paragraph", "English paragraph"],
			en: { seoTitle: "50-60 chars", seoDescription: "140-160 chars" },
			vi: { seoTitle: "50-60 ký tự", seoDescription: "140-160 ký tự" },
		},
	});

	const raw = await deepseekComplete({ apiKey: opts.apiKey, system, user });
	const parsed = parseProjectTranslation(raw);
	if (!parsed.title) parsed.title = opts.title;
	if (!parsed.excerpt) parsed.excerpt = opts.excerpt;
	if (!parsed.vi.seoTitle) parsed.vi.seoTitle = clip(opts.title, 60);
	if (!parsed.vi.seoDescription) parsed.vi.seoDescription = clip(opts.excerpt || opts.title, 160);
	if (!parsed.en.seoTitle) parsed.en.seoTitle = clip(parsed.title, 60);
	if (!parsed.en.seoDescription) parsed.en.seoDescription = clip(parsed.excerpt || parsed.title, 160);
	return parsed;
}
