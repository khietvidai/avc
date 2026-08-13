-- Formalize the Dự án (posts) content type: field order + slide_image.
-- Safe to re-run for field rows (INSERT OR IGNORE).
-- Run this once for the column:
--   ALTER TABLE ec_posts ADD COLUMN "slide_image" TEXT;

UPDATE "_emdash_collections"
SET
	"label" = 'Dự án',
	"label_singular" = 'Dự án',
	"description" = 'Công trình bếp đã triển khai. Thêm dự án mới: điền đủ các trường, chọn danh mục, đăng ảnh đại diện + slide 16:9 + thư viện.',
	"url_pattern" = '/posts/{slug}'
WHERE "slug" = 'posts';

UPDATE "_emdash_fields" SET "sort_order" = 0 WHERE "slug" = 'title' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 1 WHERE "slug" = 'featured_image' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 3 WHERE "slug" = 'excerpt' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 4 WHERE "slug" = 'chu_dau_tu' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 5 WHERE "slug" = 'dia_chi' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 6 WHERE "slug" = 'nam_hoan_thanh' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 7 WHERE "slug" = 'quy_mo' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 8 WHERE "slug" = 'gallery' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');
UPDATE "_emdash_fields" SET "sort_order" = 9 WHERE "slug" = 'content' AND "collection_id" = (SELECT id FROM "_emdash_collections" WHERE slug = 'posts');

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZWHWXJQ0001P2MAA66E52QA',
	c.id,
	'slide_image',
	'Ảnh slide (ngang 16:9)',
	'image',
	'TEXT',
	0, 0, NULL, NULL, NULL, NULL,
	2,
	datetime('now'),
	0, 1
FROM "_emdash_collections" c
WHERE c.slug = 'posts';

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZWHWXJQ0004S2KGXMSMB6BE',
	c.id, 'chu_dau_tu', 'Chủ đầu tư', 'string', 'TEXT',
	0, 0, NULL, NULL, NULL, NULL, 4, datetime('now'), 0, 1
FROM "_emdash_collections" c WHERE c.slug = 'posts';

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZWHWXJQ000BPZRN3F6PKPQR',
	c.id, 'dia_chi', 'Địa chỉ', 'string', 'TEXT',
	0, 0, NULL, NULL, NULL, NULL, 5, datetime('now'), 0, 1
FROM "_emdash_collections" c WHERE c.slug = 'posts';

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZW9K627570TQ1T91XJDF4PB',
	c.id, 'nam_hoan_thanh', 'Năm hoàn thành', 'string', 'TEXT',
	0, 0, NULL, NULL, NULL, NULL, 6, datetime('now'), 0, 1
FROM "_emdash_collections" c WHERE c.slug = 'posts';

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZW9K628K835E2TN1B0QK7JK',
	c.id, 'quy_mo', 'Quy mô', 'string', 'TEXT',
	0, 0, NULL, NULL, NULL, NULL, 7, datetime('now'), 0, 1
FROM "_emdash_collections" c WHERE c.slug = 'posts';

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT
	'01KZW9K62840B6C83EXP8TEEPY',
	c.id, 'gallery', 'Thư viện ảnh', 'repeater', 'JSON',
	0, 0, NULL,
	'{"subFields":[{"slug":"image","type":"image","label":"Ảnh","required":true}],"minItems":0,"maxItems":24}',
	NULL, NULL, 8, datetime('now'), 0, 1
FROM "_emdash_collections" c WHERE c.slug = 'posts';
