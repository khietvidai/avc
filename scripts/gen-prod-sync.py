"""Sinh file SQL đồng bộ nội dung AVC từ DB dev local lên D1 production.

Chỉ đồng bộ schema collections + nội dung (dự án, trang chủ, lĩnh vực, menu,
widget, media, taxonomy) và 3 settings site:title/tagline/logo.
KHÔNG đụng tới bảng users/credentials/auth trên production.

Chạy:
    python3 scripts/gen-prod-sync.py
    npx wrangler d1 execute avc-db --remote --file scripts/prod-sync.sql -y
"""

import glob
import sqlite3

# DB local của miniflare (file .sqlite lớn nhất trong thư mục D1)
candidates = glob.glob(
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite"
)
candidates = [c for c in candidates if "metadata" not in c]
assert candidates, "Không tìm thấy DB local — chạy `npx emdash dev` trước"
DB = candidates[0]
OUT = "scripts/prod-sync.sql"

TABLES = [
    "_emdash_collections", "_emdash_fields", "taxonomies", "content_taxonomies",
    "_emdash_taxonomy_defs", "_emdash_menus", "_emdash_menu_items",
    "_emdash_widget_areas", "_emdash_widgets", "_emdash_bylines",
    "_emdash_content_bylines", "_emdash_sections", "media",
    "ec_pages", "ec_home", "ec_linh_vuc", "ec_posts",
]

con = sqlite3.connect(DB)
cur = con.cursor()


def qident(name):
    return '"' + name.replace('"', '""') + '"'


def qval(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, bytes):
        return "X'" + v.hex() + "'"
    return "'" + str(v).replace("'", "''") + "'"


lines = []

# Hoãn kiểm tra FK đến cuối transaction (D1 chạy cả file trong 1 transaction)
lines.append("PRAGMA defer_foreign_keys = true;")

# ec_home / ec_linh_vuc chưa tồn tại trên production
for (sql,) in cur.execute(
    "SELECT sql FROM sqlite_master WHERE type IN ('table','index') "
    "AND tbl_name IN ('ec_home','ec_linh_vuc') AND sql IS NOT NULL"
):
    sql = sql.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ", 1)
    sql = sql.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ", 1)
    sql = sql.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ", 1)
    lines.append(sql + ";")

# Xoá dữ liệu demo cũ trên production rồi chèn lại nội dung thật
# (xoá theo thứ tự ngược — bảng con trước bảng cha)
for t in reversed(TABLES):
    lines.append(f"DELETE FROM {qident(t)};")

# Các cột FK trỏ tới bảng không đồng bộ (revisions, users) — NULL hoá
NULL_COLS = {"live_revision_id", "draft_revision_id", "author_id"}

for t in TABLES:
    cols = [r[1] for r in cur.execute(f"PRAGMA table_info({qident(t)})")]
    collist = ",".join(qident(c) for c in cols)
    null_idx = {i for i, c in enumerate(cols) if c in NULL_COLS}
    for row in cur.execute(f"SELECT * FROM {qident(t)}"):
        vals = ",".join(
            "NULL" if i in null_idx else qval(v) for i, v in enumerate(row)
        )
        lines.append(f"INSERT INTO {qident(t)} ({collist}) VALUES ({vals});")

for name, value in cur.execute(
    "SELECT name, value FROM options "
    "WHERE name IN ('site:title','site:tagline','site:logo')"
):
    lines.append(
        f"INSERT OR REPLACE INTO options (name, value) "
        f"VALUES ({qval(name)}, {qval(value)});"
    )

with open(OUT, "w") as f:
    f.write("\n".join(lines) + "\n")

inserts = sum(1 for l in lines if l.startswith("INSERT"))
print(f"Đã ghi {OUT}: {len(lines)} câu lệnh, {inserts} INSERT")
