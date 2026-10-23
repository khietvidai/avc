/**
 * Meta descriptions for project pages.
 *
 * Google renders about 155 characters and the site's SEO standard is 140–160
 * (see AGENTS.md). The English project excerpts and most CMS excerpts are
 * one-liners of 25–100 characters, so a page description is assembled from the
 * fragments a project already has — opening paragraph, client, address — and
 * stops before the limit instead of being cut mid-word.
 */

export const META_DESCRIPTION_MAX = 160;

/** Below this a description is considered too thin to leave as it is. */
export const META_DESCRIPTION_MIN = 120;

interface ComposeOptions {
	max?: number;
	/**
	 * Allow the first fragment that does not fit to be cut on a word boundary
	 * and added with an ellipsis. Use it for prose (a content paragraph), not
	 * for labelled fragments such as "Client: …", which read badly when cut.
	 */
	fill?: boolean;
}

/**
 * Join `parts` into the longest description that still fits `max`, keeping
 * each fragment whole. Returns "" when there is nothing to describe.
 */
export function composeMetaDescription(parts: readonly string[], options: ComposeOptions = {}): string {
	const { max = META_DESCRIPTION_MAX, fill = false } = options;
	const fragments = parts.map(normalise).filter(Boolean);
	if (fragments.length === 0) return "";

	const packed = fragments.reduce<{ text: string; rest: string[] }>(
		(acc, fragment) => {
			const next = acc.text ? `${acc.text} ${fragment}` : fragment;
			return next.length <= max
				? { text: next, rest: acc.rest }
				: { text: acc.text, rest: [...acc.rest, fragment] };
		},
		{ text: "", rest: [] },
	);

	if (!packed.text) return clampOnWord(fragments[0]!, max);
	if (!fill || packed.rest.length === 0) return packed.text;

	const room = max - packed.text.length - 1;
	if (room < 40) return packed.text;
	return `${packed.text} ${clampOnWord(packed.rest[0]!, room)}`;
}

function normalise(part: string | null | undefined): string {
	return (part ?? "").replace(/\s+/g, " ").trim();
}

/** Cut on a word boundary, drop dangling punctuation, mark the cut. */
function clampOnWord(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(" ");
	const kept = lastSpace > max / 3 ? cut.slice(0, lastSpace) : cut;
	return `${kept.replace(/[\s,.;:—–-]+$/, "")}…`;
}
