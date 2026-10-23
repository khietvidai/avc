import { getEmDashCollection } from "emdash";
import { bareCmsId } from "./i18n-routes";

/**
 * Accent-insensitive fallback for the CMS full-text search.
 *
 * EmDash's FTS matches some unaccented queries ("khach san") but not others
 * ("bep", "cong nghiep"), and Vietnamese visitors routinely type without
 * diacritics. When FTS comes back empty this folds both sides and matches over
 * the project fields a visitor would search by. The collection is ~20 entries,
 * so the scan is cheap; FTS stays the primary path.
 */

export interface SearchFallbackItem {
	id: string;
	slug: string;
	title: string;
	snippet?: string;
}

/** Strip Vietnamese diacritics so "bếp" and "bep" compare equal. */
export function foldDiacritics(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase();
}

function haystack(data: Record<string, unknown>): string {
	return foldDiacritics(
		["title", "excerpt", "chu_dau_tu", "dia_chi", "quy_mo", "nam_hoan_thanh"]
			.map((key) => (typeof data[key] === "string" ? (data[key] as string) : ""))
			.join(" "),
	);
}

export async function searchFallback(query: string, limit = 30): Promise<SearchFallbackItem[]> {
	const tokens = foldDiacritics(query).split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return [];

	const { entries } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		locale: "vi",
		limit: 200,
	});

	return entries
		.filter((entry) => {
			const text = haystack(entry.data as unknown as Record<string, unknown>);
			return tokens.every((token) => text.includes(token));
		})
		.slice(0, limit)
		.map((entry) => ({
			id: String(entry.id),
			slug: bareCmsId(String(entry.id)),
			title: String(entry.data.title ?? ""),
			snippet: typeof entry.data.excerpt === "string" ? entry.data.excerpt : undefined,
		}));
}
