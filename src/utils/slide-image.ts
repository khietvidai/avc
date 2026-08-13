/** Fallback 16:9 crops in public/images/slides/{slug}.jpg (PROFILE originals). */
const SLIDE_SLUGS = new Set([
	"soumaki-quan-7",
	"pasta-club",
	"ka-en-japanese-grill",
	"nabe-suki",
	"kim-quan",
	"truffle-co",
	"pizza-4ps-estella",
	"k-mazing",
	"sansung-korean-bbq",
	"can-tin-thep-thong-nhat",
	"bartels-sonatus",
	"belgo-belgian-brasserie",
	"the-diners-club",
	"cafe-in-thao-dien",
]);

export function slideImageSrc(slug: string): string | null {
	const bare = slug.replace(/^(vi|en)\//, "");
	return SLIDE_SLUGS.has(bare) ? `/images/slides/${bare}.jpg` : null;
}

type MediaLike = { id?: string; src?: string } | null | undefined;

/** Prefer CMS slide_image, then static crop, then featured image. */
export function resolveSlide(
	slug: string,
	slideImage: MediaLike,
	featuredImage: MediaLike,
): { kind: "cms"; image: NonNullable<MediaLike> } | { kind: "static"; src: string } | { kind: "featured"; image: NonNullable<MediaLike> } | null {
	if (slideImage && (slideImage.src || slideImage.id)) {
		return { kind: "cms", image: slideImage };
	}
	const src = slideImageSrc(slug);
	if (src) return { kind: "static", src };
	if (featuredImage && (featuredImage.src || featuredImage.id)) {
		return { kind: "featured", image: featuredImage };
	}
	return null;
}
