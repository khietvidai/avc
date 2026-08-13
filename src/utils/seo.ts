import { toEnUrl, toViUrl } from "./i18n-routes";
import { absolutize, canonicalUrl } from "./site-url";

export const ORG = {
	legalName: "Công ty TNHH Thiết Bị Công Nghiệp AVC",
	nameEn: "AVC Industrial Equipment Co., Ltd",
	nameVi: "Công ty TNHH Thiết Bị Công Nghiệp AVC",
	telephone: "+84-1900-0054",
	email: "info@avc.equipment",
	sameAs: ["https://www.linkedin.com/company/avc-equipment"],
	streetAddress: "58 Nguyen Hoang, Binh Trung Ward",
	addressLocality: "Ho Chi Minh City",
	addressCountry: "VN",
	areaServed: "VN",
	priceRange: "$$",
} as const;

export type SeoLocale = "en" | "vi";

export function orgName(locale: SeoLocale): string {
	return locale === "en" ? ORG.nameEn : ORG.nameVi;
}

export function defaultDescription(locale: SeoLocale): string {
	return locale === "en"
		? "Turnkey commercial kitchen solutions in Vietnam — consulting, design, equipment supply, installation and maintenance."
		: "Giải pháp bếp công nghiệp trọn gói tại Việt Nam — tư vấn, thiết kế, cung cấp thiết bị, thi công và bảo trì.";
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
}): Record<string, unknown> {
	const { origin, pathname, locale, title, description, canonical, image, logo, project } = opts;
	const orgId = `${origin}/#organization`;
	const siteId = `${origin}/#website`;
	const pageId = `${canonical}#webpage`;

	const organization = {
		"@type": ["Organization", "ProfessionalService"],
		"@id": orgId,
		name: orgName(locale),
		legalName: ORG.legalName,
		url: origin,
		telephone: ORG.telephone,
		email: ORG.email,
		logo: logo ? { "@type": "ImageObject", url: logo } : undefined,
		image: image || logo || undefined,
		sameAs: ORG.sameAs,
		areaServed: { "@type": "Country", name: "Vietnam" },
		priceRange: ORG.priceRange,
		address: {
			"@type": "PostalAddress",
			streetAddress: ORG.streetAddress,
			addressLocality: ORG.addressLocality,
			addressCountry: ORG.addressCountry,
		},
	};

	const website = {
		"@type": "WebSite",
		"@id": siteId,
		url: origin,
		name: orgName(locale),
		inLanguage: locale === "en" ? "en" : "vi",
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

	const webPage = {
		"@type": pageSchemaType(pathname),
		"@id": pageId,
		url: canonical,
		name: title,
		description,
		inLanguage: locale === "en" ? "en" : "vi",
		isPartOf: { "@id": siteId },
		about: { "@id": orgId },
		primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : undefined,
		breadcrumb: { "@id": `${canonical}#breadcrumb` },
	};

	const graph: Record<string, unknown>[] = [organization, website, webPage, breadcrumb];

	if (project) {
		graph.push({
			"@type": "Project",
			"@id": `${canonical}#project`,
			name: project.name,
			description: project.description || undefined,
			image: project.image || undefined,
			url: project.url,
			inLanguage: locale === "en" ? "en" : "vi",
			datePublished: project.datePublished || undefined,
			dateModified: project.dateModified || undefined,
			location: project.location
				? { "@type": "Place", name: project.location, address: project.location }
				: undefined,
			sponsor: project.client ? { "@type": "Organization", name: project.client } : undefined,
			contributor: { "@id": orgId },
			mainEntityOfPage: { "@id": pageId },
		});
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
