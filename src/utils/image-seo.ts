import { projectEn } from "./projects-en";

/** Natural English alt/title for SEO — descriptive, not stuffed. */
export interface ImageSeo {
	alt: string;
	title: string;
	caption?: string;
	comment: string;
}

const SUFFIX = "AVC commercial kitchen equipment, Vietnam";

export const STATIC_IMAGE_SEO: Record<string, ImageSeo> = {
	"/images/team-avc.jpg": {
		alt: "AVC commercial kitchen engineers and project team",
		title: "AVC industrial kitchen team — design, fabrication and installation",
		caption: "AVC project team delivering turnkey commercial kitchens across Vietnam.",
		comment: `AVC industrial kitchen team. ${SUFFIX}`,
	},
	"/images/khen-thuong.jpg": {
		alt: "AVC commercial kitchen team receiving industry recognition",
		title: "AVC awarded for commercial kitchen projects in Vietnam",
		caption: "Recognition for AVC’s commercial kitchen installation work.",
		comment: `AVC kitchen contractor award. ${SUFFIX}`,
	},
	"/images/bep-hoan-thien-2.jpg": {
		alt: "Completed AVC stainless steel commercial kitchen line",
		title: "Finished industrial kitchen by AVC — cookline and exhaust",
		caption: "A completed AVC commercial kitchen: cookline, exhaust and stainless worktops.",
		comment: `Completed commercial kitchen by AVC. ${SUFFIX}`,
	},
	"/images/nha-may.jpg": {
		alt: "AVC stainless steel factory with CNC laser cutting for kitchen equipment",
		title: "AVC factory — custom stainless commercial kitchen fabrication",
		caption: "In-house stainless fabrication for AVC industrial kitchen equipment.",
		comment: `AVC stainless factory CNC kitchen fabrication. ${SUFFIX}`,
	},
	"/images/kho-hang.jpg": {
		alt: "AVC warehouse stocked with commercial kitchen equipment",
		title: "AVC Ho Chi Minh warehouse — imported kitchen equipment",
		caption: "Warehouse stock for fast nationwide commercial kitchen delivery.",
		comment: `AVC kitchen equipment warehouse HCMC. ${SUFFIX}`,
	},
	"/images/banner-tu-van.jpg": {
		alt: "AVC investment consulting for a commercial kitchen project",
		title: "Commercial kitchen consulting — capacity, standards and budget",
		comment: `AVC commercial kitchen consulting. ${SUFFIX}`,
	},
	"/images/banner-thiet-ke.jpg": {
		alt: "AVC 2D 3D MEP commercial kitchen design",
		title: "Industrial kitchen layout design and MEP coordination by AVC",
		comment: `AVC kitchen design 2D 3D MEP. ${SUFFIX}`,
	},
	"/images/banner-cung-cap.jpg": {
		alt: "AVC supplying imported commercial kitchen equipment",
		title: "Commercial kitchen equipment supply — Hoshizaki, Unox, Hobart",
		comment: `AVC kitchen equipment supply brands. ${SUFFIX}`,
	},
	"/images/banner-thi-cong.jpg": {
		alt: "AVC installing a stainless commercial kitchen",
		title: "Commercial kitchen installation and commissioning by AVC",
		comment: `AVC kitchen installation. ${SUFFIX}`,
	},
	"/images/banner-bao-hanh.jpg": {
		alt: "AVC warranty and maintenance on commercial kitchen equipment",
		title: "24/7 commercial kitchen maintenance and warranty — AVC",
		comment: `AVC kitchen warranty maintenance. ${SUFFIX}`,
	},
	"/images/banner-san-xuat.jpg": {
		alt: "AVC fabricating custom stainless kitchen equipment",
		title: "Custom stainless steel kitchen fabrication at the AVC factory",
		comment: `AVC stainless kitchen fabrication. ${SUFFIX}`,
	},
};

const MARKET_SEO: Record<string, ImageSeo> = {
	"nha-hang": {
		alt: "AVC restaurant commercial kitchen — cookline and exhaust",
		title: "Restaurant kitchen equipment and installation by AVC",
		comment: `AVC restaurant commercial kitchen. ${SUFFIX}`,
	},
	"khach-san": {
		alt: "AVC hotel commercial kitchen for banquet and F&B service",
		title: "Hotel kitchen equipment and installation by AVC",
		comment: `AVC hotel commercial kitchen. ${SUFFIX}`,
	},
	"bep-trung-tam": {
		alt: "AVC central kitchen for multi-outlet F&B production",
		title: "Central kitchen design and equipment by AVC",
		comment: `AVC central kitchen commissary. ${SUFFIX}`,
	},
	"khu-cong-nghiep": {
		alt: "AVC industrial canteen kitchen in a factory park",
		title: "Industrial canteen kitchen equipment by AVC",
		comment: `AVC industrial canteen kitchen. ${SUFFIX}`,
	},
	bakery: {
		alt: "AVC bakery kitchen — ovens, proofers and pastry line",
		title: "Bakery kitchen equipment and installation by AVC",
		comment: `AVC bakery commercial kitchen. ${SUFFIX}`,
	},
	"bar-cafe": {
		alt: "AVC bar and café kitchen — espresso, cold rooms and prep",
		title: "Bar and café kitchen equipment by AVC",
		comment: `AVC bar cafe commercial kitchen. ${SUFFIX}`,
	},
};

export function marketImageSeo(slug: string): ImageSeo {
	const bare = slug.replace(/^(vi|en)\//, "");
	return (
		MARKET_SEO[bare] ?? {
			alt: "AVC commercial kitchen project",
			title: "Commercial kitchen equipment by AVC Vietnam",
			comment: SUFFIX,
		}
	);
}

export function projectImageSeo(cmsSlug: string, kind: "featured" | "slide" | "gallery" = "featured"): ImageSeo {
	const p = projectEn(cmsSlug);
	const name = p?.title ?? cmsSlug.replace(/^(vi|en)\//, "").replace(/-/g, " ");
	const where = p?.location ? `, ${p.location}` : ", Vietnam";
	const role =
		kind === "slide"
			? "storefront and completed kitchen"
			: kind === "gallery"
				? "kitchen interior after installation"
				: "featured commercial kitchen";
	return {
		alt: `${name} — AVC ${role}${where}`,
		title: `${name} commercial kitchen by AVC | industrial kitchen equipment`,
		caption: `AVC commercial kitchen project: ${name}.`,
		comment: `${name} commercial kitchen installation by AVC. ${SUFFIX}`,
	};
}

export function heroImageSeo(): ImageSeo {
	return {
		alt: "AVC commercial kitchen installation — stainless cookline and exhaust hood",
		title: "Turnkey industrial kitchen by AVC Vietnam",
		caption: "An AVC-built commercial kitchen: cookline, extraction and stainless fabrication.",
		comment: `AVC commercial kitchen hero. ${SUFFIX}`,
	};
}

export function logoImageSeo(): ImageSeo {
	return {
		alt: "AVC Industrial Equipment — commercial kitchen contractor Vietnam",
		title: "AVC commercial kitchen equipment",
		comment: `AVC logo. ${SUFFIX}`,
	};
}

export function staticImageSeo(src: string): ImageSeo | undefined {
	return STATIC_IMAGE_SEO[src];
}
