-- Schema doanh nghiệp (JSON-LD source). Safe to re-run.

INSERT OR IGNORE INTO "_emdash_collections" (
	"id","slug","label","label_singular","description","icon","supports","source",
	"created_at","updated_at","search_config","has_seo","url_pattern",
	"comments_enabled","comments_moderation","comments_closed_after_days","comments_auto_approve_users"
) VALUES (
	'01KZX000000000000000ORG01','organization','Schema doanh nghiệp','Schema doanh nghiệp',
	'Nguồn JSON-LD Google (Organization / LocalBusiness). Sửa ở đây, không sửa code.',
	NULL,'["drafts"]','seed',datetime('now'),datetime('now'),NULL,0,NULL,0,'first_time',90,1
);

CREATE TABLE IF NOT EXISTS "ec_organization" (
	"id" text primary key,
	"slug" text,
	"status" text default 'draft',
	"author_id" text,
	"primary_byline_id" text,
	"created_at" text default (datetime('now')),
	"updated_at" text default (datetime('now')),
	"published_at" text,
	"scheduled_at" text,
	"deleted_at" text,
	"version" integer default 1,
	"live_revision_id" text,
	"draft_revision_id" text,
	"locale" text default 'en' not null,
	"translation_group" text,
	"title" text default '' not null,
	"legal_name" text,
	"name_vi" text,
	"name_en" text,
	"description_vi" text,
	"description_en" text,
	"telephone" text,
	"email" text,
	"street_address" text,
	"address_locality" text,
	"address_region" text,
	"postal_code" text,
	"address_country" text,
	"warehouse_address" text,
	"same_as" text,
	"price_range" text,
	"founding_year" text,
	"latitude" text,
	"longitude" text,
	constraint "ec_organization_slug_locale_unique" unique ("slug", "locale")
);

INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD01', id, 'title', 'Tên nội bộ', 'string', 'TEXT', 1, 0, NULL, NULL, NULL, NULL, 0, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD02', id, 'legal_name', 'Tên pháp lý', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 1, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD03', id, 'name_vi', 'Tên hiển thị (VI)', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 2, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD04', id, 'name_en', 'Tên hiển thị (EN)', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 3, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD05', id, 'description_vi', 'Mô tả (VI)', 'text', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 4, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD06', id, 'description_en', 'Mô tả (EN)', 'text', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 5, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD07', id, 'telephone', 'Điện thoại (E.164)', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 6, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD08', id, 'email', 'Email', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 7, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD09', id, 'street_address', 'Địa chỉ showroom', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 8, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD10', id, 'address_locality', 'Thành phố', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 9, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD11', id, 'address_region', 'Tỉnh / thành', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 10, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD12', id, 'postal_code', 'Mã bưu chính', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 11, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD13', id, 'address_country', 'Mã quốc gia (ISO)', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 12, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD14', id, 'warehouse_address', 'Địa chỉ kho', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 13, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD15', id, 'same_as', 'Mạng xã hội (mỗi URL một dòng)', 'text', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 14, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD16', id, 'price_range', 'Khoảng giá ($$)', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 15, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD17', id, 'founding_year', 'Năm thành lập', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 16, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD18', id, 'latitude', 'Vĩ độ showroom', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 17, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';
INSERT OR IGNORE INTO "_emdash_fields" (
	"id","collection_id","slug","label","type","column_type","required","unique",
	"default_value","validation","widget","options","sort_order","created_at","searchable","translatable"
)
SELECT '01KZX000000000000000FLD19', id, 'longitude', 'Kinh độ showroom', 'string', 'TEXT', 0, 0, NULL, NULL, NULL, NULL, 18, datetime('now'), 0, 1 FROM "_emdash_collections" WHERE slug = 'organization';

INSERT OR IGNORE INTO "ec_organization" (
	"id","slug","status","created_at","updated_at","published_at","locale","translation_group",
	"title","legal_name","name_vi","name_en","description_vi","description_en",
	"telephone","email","street_address","address_locality","address_region",
	"postal_code","address_country","warehouse_address","same_as","price_range",
	"founding_year","latitude","longitude"
) VALUES (
	'01KZX000000000000000ENT01','avc','published',datetime('now'),datetime('now'),datetime('now'),
	'en','01KZX000000000000000ENT01',
	'AVC',
	'Công ty TNHH Thiết Bị Công Nghiệp AVC',
	'Công ty TNHH Thiết Bị Công Nghiệp AVC',
	'AVC Industrial Equipment Co., Ltd',
	'Giải pháp bếp công nghiệp trọn gói tại Việt Nam — tư vấn, thiết kế, cung cấp thiết bị, thi công và bảo trì.',
	'Turnkey commercial kitchen solutions in Vietnam — consulting, design, equipment supply, installation and maintenance.',
	'+84-1900-0054','info@avc.equipment',
	'58 Nguyen Hoang, Binh Trung Ward','Ho Chi Minh City','Ho Chi Minh','',
	'VN','12/64 Thanh Loc 27 St., Quarter 3C, District 12, Ho Chi Minh City',
	'https://www.linkedin.com/in/avc-equipment/','$$','','',''
);
