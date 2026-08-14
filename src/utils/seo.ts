import { toEnUrl, toViUrl } from "./i18n-routes";
import { absolutize, canonicalUrl } from "./site-url";

/**
 * Fallback when the CMS `organization` (Schema doanh nghiệp) row is missing.
 * Prefer editing Admin → Schema doanh nghiệp → avc.
 */
export const ORG = {
	legalName: "Công ty TNHH Thiết Bị Công Nghiệp AVC",
	nameEn: "AVC Industrial Equipment Co., Ltd",
	nameVi: "Công ty TNHH Thiết Bị Công Nghiệp AVC",
	descriptionEn:
		"Turnkey commercial kitchen solutions in Vietnam — consulting, design, equipment supply, installation and maintenance.",
	descriptionVi:
		"Giải pháp bếp công nghiệp trọn gói tại Việt Nam — tư vấn, thiết kế, cung cấp thiết bị, thi công và bảo trì.",
	telephone: "+84-1900-0054",
	email: "info@avc.equipment",
	sameAs: ["https://www.linkedin.com/in/avc-equipment/"],
	streetAddress: "58 Nguyen Hoang, Binh Trung Ward",
	addressLocality: "Ho Chi Minh City",
	addressRegion: "Ho Chi Minh",
	postalCode: "",
	addressCountry: "VN",
	warehouseAddress: "12/64 Thanh Loc 27 St., Quarter 3C, District 12, Ho Chi Minh City",
	areaServed: "VN",
	priceRange: "$$",
	foundingYear: "",
	latitude: "",
	longitude: "",
} as const;

export type SeoLocale = "en" | "vi";

export type OrgProfile = {
	legalName: string;
	nameEn: string;
	nameVi: string;
	descriptionEn: string;
	descriptionVi: string;
	telephone: string;
	email: string;
	sameAs: string[];
	streetAddress: string;
	addressLocality: string;
	addressRegion: string;
	postalCode: string;
	addressCountry: string;
	warehouseAddress: string;
	priceRange: string;
	foundingYear: string;
	latitude: string;
	longitude: string;
};

function pick(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function splitLines(value: unknown, fallback: readonly string[]): string[] {
	if (typeof value !== "string" || !value.trim()) return [...fallback];
	return value
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => /^https?:\/\//i.test(s));
}

export function orgFromEntry(entry: { data?: Record<string, unknown> } | null | undefined): OrgProfile {
	const d = entry?.data ?? {};
	return {
		legalName: pick(d.legal_name, ORG.legalName),
		nameEn: pick(d.name_en, ORG.nameEn),
		nameVi: pick(d.name_vi, ORG.nameVi),
		descriptionEn: pick(d.description_en, ORG.descriptionEn),
		descriptionVi: pick(d.description_vi, ORG.descriptionVi),
		telephone: pick(d.telephone, ORG.telephone),
		email: pick(d.email, ORG.email),
		sameAs: splitLines(d.same_as, ORG.sameAs),
		streetAddress: pick(d.street_address, ORG.streetAddress),
		addressLocality: pick(d.address_locality, ORG.addressLocality),
		addressRegion: pick(d.address_region, ORG.addressRegion),
		postalCode: pick(d.postal_code, ORG.postalCode),
		addressCountry: pick(d.address_country, ORG.addressCountry),
		warehouseAddress: pick(d.warehouse_address, ORG.warehouseAddress),
		priceRange: pick(d.price_range, ORG.priceRange),
		foundingYear: pick(d.founding_year, ORG.foundingYear),
		latitude: pick(d.latitude, ORG.latitude),
		longitude: pick(d.longitude, ORG.longitude),
	};
}

export function orgName(locale: SeoLocale, org: OrgProfile = orgFromEntry(null)): string {
	return locale === "en" ? org.nameEn : org.nameVi;
}

export function defaultDescription(locale: SeoLocale, org: OrgProfile = orgFromEntry(null)): string {
	return locale === "en" ? org.descriptionEn : org.descriptionVi;
}

export function hreflangLinks(origin: string, pathname: string): { en: string; vi: string; xDefault: string } {
	const en = origin + toEnUrl(pathname);
	const vi = origin + toViUrl(pathname);
	return { en, vi, xDefault: en };
}

export interface Breadcrumb {
	name: string;
	path: string;
}

export function breadcrumbsFor(pathname: string, locale: SeoLocale, pageTitle: string): Breadcrumb[] {
	const home = { name: locale === "en" ? "Home" : "Trang chủ", path: locale === "en" ? "/" : "/vi/" };
	if (pathname === "/" || pathname === "/vi" || pathname === "/vi/") return [home];

	const crumbs: Breadcrumb[] = [home];
	const bare = pathname.replace(/^\/vi(?=\/|$)/, "") || "/";

	if (bare.startsWith("/category/") || bare === "/portfolio" || bare.startsWith("/projects") || bare.startsWith("/posts")) {
		crumbs.push({
			name: "Portfolio",
			path: locale === "en" ? "/portfolio" : "/vi/portfolio",
		});
	} else if (bare.startsWith("/about") || bare.startsWith("/gioi-thieu")) {
		crumbs.push({ name: locale === "en" ? "About" : "Giới thiệu", path: pathname });
		return crumbs;
	} else if (bare.startsWith("/services") || bare.startsWith("/dich-vu")) {
		crumbs.push({ name: locale === "en" ? "Services" : "Dịch vụ", path: pathname });
		return crumbs;
	} else if (bare.startsWith("/products") || bare.startsWith("/san-pham")) {
		crumbs.push({ name: locale === "en" ? "Products" : "Sản phẩm", path: pathname });
		return crumbs;
	} else if (bare.startsWith("/contact") || bare.startsWith("/lien-he")) {
		crumbs.push({ name: locale === "en" ? "Contact" : "Liên hệ", path: pathname });
		return crumbs;
	}

	if (bare !== "/portfolio") {
		crumbs.push({ name: pageTitle, path: pathname });
	}
	return crumbs;
}

function pageSchemaType(pathname: string): string {
	const bare = pathname.replace(/^\/vi(?=\/|$)/, "") || "/";
	if (bare === "/" || bare === "") return "WebPage";
	if (bare.startsWith("/about") || bare.startsWith("/gioi-thieu")) return "AboutPage";
	if (bare.startsWith("/contact") || bare.startsWith("/lien-he")) return "ContactPage";
	if (bare.startsWith("/projects/") || bare.startsWith("/posts/")) return "WebPage";
	if (bare.startsWith("/portfolio") || bare.startsWith("/category") || bare === "/projects" || bare === "/posts") {
		return "CollectionPage";
	}
	return "WebPage";
}

function isIdentityPage(pathname: string): boolean {
	const bare = pathname.replace(/^\/vi(?=\/|$)/, "") || "/";
	return (
		bare === "/" ||
		bare === "" ||
		bare.startsWith("/about") ||
		bare.startsWith("/gioi-thieu") ||
		bare.startsWith("/contact") ||
		bare.startsWith("/lien-he")
	);
}

function postalAddress(org: OrgProfile, street: string) {
	return {
		"@type": "PostalAddress",
		streetAddress: street,
		addressLocality: org.addressLocality,
		addressRegion: org.addressRegion || undefined,
		postalCode: org.postalCode || undefined,
		addressCountry: org.addressCountry,
	};
}

export interface ProjectSchemaInput {
	name: string;
	description?: string | null;
	image?: string | null;
	url: string;
	location?: string | null;
	client?: string | null;
	datePublished?: string | null;
	dateModified?: string | null;
}

export function buildSeoGraph(opts: {
	origin: string;
	pathname: string;
	locale: SeoLocale;
	title: string;
	description: string;
	canonical: string;
	image?: string | null;
	logo?: string | null;
	project?: ProjectSchemaInput | null;
	org?: OrgProfile;
}): Record<string, unknown> {
	const org = opts.org ?? orgFromEntry(null);
	const { origin, pathname, locale, title, description, canonical, image, logo, project } = opts;
	const orgId = `${origin}/#organization`;
	const siteId = `${origin}/#website`;
	const pageId = `${canonical}#webpage`;
	const lang = locale === "en" ? "en" : "vi";

	/**
	 * Google Search gallery (updated 2026-06-15) that apply here:
	 *   Organization, LocalBusiness, Breadcrumb.
	 * LocalBusiness is an Organization subtype — one node, both types
	 * (Google: multiple @type as an array; follow Organization fields too).
	 * ProfessionalService is deprecated on schema.org (2014) — do not use.
	 * SearchAction / sitelinks searchbox was retired by Google in Oct 2024 —
	 * WebSite stays for site-name (name + url + alternateName only).
	 * schema.org/Project is NOT a Google rich-result type — project pages use
	 * WebPage + Service (honest: a kitchen installation job; not a rich result).
	 */
	const organization: Record<string, unknown> = {
		"@type": ["Organization", "LocalBusiness"],
		"@id": orgId,
		name: orgName(locale, org),
		alternateName: ["AVC", locale === "en" ? org.nameVi : org.nameEn],
		legalName: org.legalName,
		description: locale === "en" ? org.descriptionEn : org.descriptionVi,
		url: origin,
		telephone: org.telephone,
		email: org.email,
		logo: logo ? { "@type": "ImageObject", url: logo } : undefined,
		image: image || logo || undefined,
		sameAs: org.sameAs.length ? org.sameAs : undefined,
		areaServed: { "@type": "Country", name: "Vietnam" },
		priceRange: org.priceRange,
		foundingDate: org.foundingYear || undefined,
		address: postalAddress(org, org.streetAddress),
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "customer service",
			telephone: org.telephone,
			email: org.email,
			areaServed: "VN",
			availableLanguage: ["Vietnamese", "English"],
		},
	};

	if (org.latitude && org.longitude) {
		organization.geo = {
			"@type": "GeoCoordinates",
			latitude: org.latitude,
			longitude: org.longitude,
		};
	}

	if (org.warehouseAddress) {
		organization.department = [
			{
				"@type": "LocalBusiness",
				name: locale === "en" ? "AVC warehouse" : "Kho AVC",
				address: {
					"@type": "PostalAddress",
					streetAddress: org.warehouseAddress,
					addressLocality: org.addressLocality,
					addressCountry: org.addressCountry,
				},
			},
		];
	}

	const website = {
		"@type": "WebSite",
		"@id": siteId,
		url: origin,
		name: "AVC",
		alternateName: [orgName(locale, org), "AVC Industrial Equipment"],
		inLanguage: lang,
		publisher: { "@id": orgId },
	};

	const crumbs = breadcrumbsFor(pathname, locale, title);
	const breadcrumb = {
		"@type": "BreadcrumbList",
		"@id": `${canonical}#breadcrumb`,
		itemListElement: crumbs.map((c, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: c.name,
			item: canonicalUrl(origin, c.path),
		})),
	};

	const webPage: Record<string, unknown> = {
		"@type": pageSchemaType(pathname),
		"@id": pageId,
		url: canonical,
		name: title,
		description,
		inLanguage: lang,
		isPartOf: { "@id": siteId },
		about: { "@id": orgId },
		publisher: { "@id": orgId },
		primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : undefined,
		breadcrumb: { "@id": `${canonical}#breadcrumb` },
	};

	const graph: Record<string, unknown>[] = isIdentityPage(pathname)
		? [organization, website, webPage, breadcrumb]
		: [
				{
					"@type": ["Organization", "LocalBusiness"],
					"@id": orgId,
					name: orgName(locale, org),
					url: origin,
					logo: logo ? { "@type": "ImageObject", url: logo } : undefined,
				},
				website,
				webPage,
				breadcrumb,
			];

	if (project) {
		const serviceId = `${canonical}#service`;
		graph.push({
			"@type": "Service",
			"@id": serviceId,
			name: project.name,
			description: project.description || undefined,
			image: project.image || undefined,
			url: project.url,
			provider: { "@id": orgId },
			areaServed: { "@type": "Country", name: "Vietnam" },
			serviceType: locale === "en" ? "Commercial kitchen installation" : "Thi công bếp công nghiệp",
			audience: project.client ? { "@type": "Organization", name: project.client } : undefined,
		});
		webPage.mainEntity = { "@id": serviceId };
	}

	return {
		"@context": "https://schema.org",
		"@graph": graph.map(stripEmpty),
	};
}

function stripEmpty(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripEmpty).filter((v) => v !== undefined);
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			const cleaned = stripEmpty(v);
			if (cleaned !== undefined && cleaned !== null && cleaned !== "") out[k] = cleaned;
		}
		return out;
	}
	return value;
}

export { absolutize, canonicalUrl };
