/**
 * Project gallery values have lived in three shapes:
 *   1. repeater rows  [{ image: Media }, ...]  ← admin picker (current)
 *   2. media array    [Media, ...]             ← older json field
 *   3. single media   Media                    ← json widget after one upload
 *
 * Always return a flat list of media objects the <Image> component accepts.
 */
export type GalleryMedia = {
	id: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	provider?: string;
	previewUrl?: string;
	filename?: string;
	mimeType?: string;
	meta?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMedia(value: unknown): value is GalleryMedia {
	return isRecord(value) && typeof value.id === "string" && value.id.length > 0;
}

function rowImage(value: unknown): GalleryMedia | null {
	if (isMedia(value)) return value;
	if (isRecord(value) && isMedia(value.image)) return value.image;
	return null;
}

export function galleryImages(raw: unknown): GalleryMedia[] {
	if (raw == null) return [];
	const items = Array.isArray(raw) ? raw : [raw];
	const out: GalleryMedia[] = [];
	for (const item of items) {
		const image = rowImage(item);
		if (image) out.push(image);
	}
	return out;
}
