-- Turn posts.gallery into a repeater with an image picker.
-- Safe to re-run. Column stays JSON; only the field definition and value shape change.

UPDATE "_emdash_fields"
SET
	"type" = 'repeater',
	"column_type" = 'JSON',
	"label" = 'Thư viện ảnh',
	"widget" = NULL,
	"options" = NULL,
	"validation" = '{"subFields":[{"slug":"image","type":"image","label":"Ảnh","required":true}],"minItems":0,"maxItems":24}'
WHERE "slug" = 'gallery'
	AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');

-- Single media object → [{ "image": <media> }]
UPDATE "ec_posts"
SET "gallery" = json_array(json_object('image', json("gallery")))
WHERE "gallery" IS NOT NULL
	AND json_valid("gallery")
	AND json_type("gallery") = 'object'
	AND json_extract("gallery", '$.id') IS NOT NULL
	AND json_extract("gallery", '$.image') IS NULL;

-- Array of media objects → [{ "image": <media> }, ...]
UPDATE "ec_posts"
SET "gallery" = (
	SELECT json_group_array(json_object('image', json(value)))
	FROM json_each("ec_posts"."gallery")
)
WHERE "gallery" IS NOT NULL
	AND json_valid("gallery")
	AND json_type("gallery") = 'array'
	AND json_array_length("gallery") > 0
	AND json_extract("gallery", '$[0].id') IS NOT NULL
	AND json_extract("gallery", '$[0].image') IS NULL;
