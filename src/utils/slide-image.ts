/** 16:9 crops in public/images/slides/{slug}.jpg, made from PROFILE originals. */
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
	return SLIDE_SLUGS.has(slug) ? `/images/slides/${slug}.jpg` : null;
}
