/** Canonical English paths (default locale). Vietnamese stays under /vi/ + original slugs. */

export const PAGE_TO_EN: Record<string, string> = {
	"/gioi-thieu": "/about",
	"/dich-vu": "/services",
	"/san-pham": "/products",
	"/lien-he": "/contact",
	"/posts": "/projects",
};

export const PAGE_TO_VI: Record<string, string> = {
	"/about": "/gioi-thieu",
	"/services": "/dich-vu",
	"/products": "/san-pham",
	"/contact": "/lien-he",
	"/projects": "/posts",
};

export const HASH_TO_EN: Record<string, string> = {
	"tu-van": "consulting",
	"thiet-ke": "design",
	"cung-cap": "supply",
	"thi-cong": "installation",
	"bao-hanh": "warranty",
	"san-xuat": "fabrication",
	"gia-tri": "values",
	"doi-ngu": "team",
	"khach-hang": "clients",
	"gioi-thieu": "about",
	"linh-vuc": "markets",
};

export const HASH_TO_VI: Record<string, string> = Object.fromEntries(
	Object.entries(HASH_TO_EN).map(([vi, en]) => [en, vi]),
);

export const CATEGORY_TO_EN: Record<string, string> = {
	"nha-hang": "restaurants",
	"khach-san": "hotels",
	"bep-trung-tam": "central-kitchens",
	"khu-cong-nghiep": "industrial-canteens",
	bakery: "bakeries",
	"bar-cafe": "bar-cafe",
};

export const CATEGORY_TO_VI: Record<string, string> = Object.fromEntries(
	Object.entries(CATEGORY_TO_EN).map(([vi, en]) => [en, vi]),
);

export const MARKET_LABEL_EN: Record<string, string> = {
	"nha-hang": "Restaurants",
	"khach-san": "Hotels",
	"bep-trung-tam": "Central Kitchens",
	"khu-cong-nghiep": "Industrial Canteens",
	bakery: "Bakeries",
	"bar-cafe": "Bar & Café",
};

export function marketLabelEn(id: string, fallback?: string): string {
	return MARKET_LABEL_EN[bareCmsId(id)] ?? fallback ?? bareCmsId(id);
}

export function viProjectPath(id: string): string {
	return `/vi/posts/${bareCmsId(id)}`;
}

export function viCategoryPath(id: string): string {
	return `/vi/category/${cmsCategorySlug(id)}`;
}

/** CMS slug (Vietnamese / original) → English URL slug */
export const PROJECT_TO_EN: Record<string, string> = {
	"bartels-sonatus": "bartels-sonatus",
	"belgo-belgian-brasserie": "belgo-belgian-brasserie",
	"cafe-in-thao-dien": "cafe-in-thao-dien",
	"can-tin-thep-thong-nhat": "thong-nhat-steel-canteen",
	"chickita-flame-grilled": "chickita-flame-grilled",
	"cocoa-kitchen": "cocoa-kitchen",
	"crust-smashburger": "crust-smashburger",
	"k-mazing": "k-mazing",
	"ka-en-japanese-grill": "ka-en-japanese-grill",
	"kim-quan": "kim-quan",
	"nabe-suki": "nabe-suki",
	"pasta-club": "pasta-club",
	"pizza-4ps-estella": "pizza-4ps-estella",
	"quan-bui-cafe-in": "quan-bui-cafe-in",
	"quan-bui-garden-2": "quan-bui-garden-2",
	"ruoc-spice": "ruoc-spice",
	"sansung-korean-bbq": "sansung-korean-bbq",
	"soumaki-quan-7": "soumaki-district-7",
	"soumaki-thao-dien": "soumaki-thao-dien",
	"the-diners-club": "the-diners-club",
	"truffle-co": "truffle-and-co",
};

export const PROJECT_TO_VI: Record<string, string> = Object.fromEntries(
	Object.entries(PROJECT_TO_EN).map(([vi, en]) => [en, vi]),
);

/** EmDash may prefix entry.id with the locale (`vi/slug`). Public slugs never include it. */
export function bareCmsId(id: string): string {
	return id.replace(/^(vi|en)\//, "");
}

export function cmsProjectSlug(param: string): string {
	const bare = bareCmsId(param);
	return PROJECT_TO_VI[bare] ?? bare;
}

export function enProjectSlug(cmsSlug: string): string {
	const bare = bareCmsId(cmsSlug);
	return PROJECT_TO_EN[bare] ?? bare;
}

export function cmsCategorySlug(param: string): string {
	const bare = bareCmsId(param);
	return CATEGORY_TO_VI[bare] ?? bare;
}

export function enCategorySlug(cmsSlug: string): string {
	const bare = bareCmsId(cmsSlug);
	return CATEGORY_TO_EN[bare] ?? bare;
}

/** Static downloads under /files/ — locale variants of the same document. */
export const FILE_TO_EN: Record<string, string> = {
	"/files/AVC-Profile.pdf": "/files/AVC-Profile-EN.pdf",
};

export const FILE_TO_VI: Record<string, string> = Object.fromEntries(
	Object.entries(FILE_TO_EN).map(([vi, en]) => [en, vi]),
);

function splitHash(url: string): { path: string; hash: string } {
	const i = url.indexOf("#");
	if (i < 0) return { path: url, hash: "" };
	return { path: url.slice(0, i), hash: url.slice(i + 1) };
}

function stripLocale(path: string): string {
	return path.replace(/^\/(en|vi)(?=\/|$)/, "") || "/";
}

function mapHash(hash: string, table: Record<string, string>): string {
	if (!hash) return "";
	return "#" + (table[hash] ?? hash);
}

/** Menu / CMS path → English public URL. */
export function toEnUrl(url: string): string {
	if (!url.startsWith("/") || url.startsWith("/_")) return url;
	if (url.startsWith("/files/")) return FILE_TO_EN[url] ?? url;
	const { path, hash } = splitHash(url);
	const bare = stripLocale(path);

	if (bare.startsWith("/posts/")) {
		const slug = bare.slice("/posts/".length);
		return `/projects/${enProjectSlug(slug)}` + mapHash(hash, HASH_TO_EN);
	}
	if (bare === "/posts") return "/projects" + mapHash(hash, HASH_TO_EN);
	if (bare.startsWith("/projects/")) {
		const slug = bare.slice("/projects/".length);
		return `/projects/${enProjectSlug(cmsProjectSlug(slug))}` + mapHash(hash, HASH_TO_EN);
	}
	if (bare.startsWith("/category/")) {
		const slug = bare.slice("/category/".length);
		return `/category/${enCategorySlug(slug)}` + mapHash(hash, HASH_TO_EN);
	}

	const mapped = PAGE_TO_EN[bare] ?? bare;
	return mapped + mapHash(hash, HASH_TO_EN);
}

/** English or bare path → Vietnamese /vi/... URL. */
export function toViUrl(url: string): string {
	if (!url.startsWith("/") || url.startsWith("/_")) return url;
	if (url.startsWith("/files/")) return FILE_TO_VI[url] ?? url;
	const { path, hash } = splitHash(url);
	const bare = stripLocale(path);

	if (bare.startsWith("/projects/")) {
		const slug = cmsProjectSlug(bare.slice("/projects/".length));
		return `/vi/posts/${slug}` + mapHash(hash, HASH_TO_VI);
	}
	if (bare === "/projects") return "/vi/posts" + mapHash(hash, HASH_TO_VI);
	if (bare.startsWith("/posts/")) {
		return `/vi/posts/${bareCmsId(bare.slice("/posts/".length))}` + mapHash(hash, HASH_TO_VI);
	}
	if (bare === "/posts") return "/vi/posts" + mapHash(hash, HASH_TO_VI);
	if (bare.startsWith("/category/")) {
		const slug = cmsCategorySlug(bare.slice("/category/".length));
		return `/vi/category/${slug}` + mapHash(hash, HASH_TO_VI);
	}

	const viPage = PAGE_TO_VI[bare] ?? bare;
	const prefix = viPage.startsWith("/vi") ? "" : "/vi";
	return (viPage === "/" ? "/vi/" : `${prefix}${viPage}`) + mapHash(hash, HASH_TO_VI);
}
