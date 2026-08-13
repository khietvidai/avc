-- Thêm 5 cột dự án mới vào ec_posts trên production (chạy MỘT LẦN duy nhất;
-- chạy lại sẽ lỗi "duplicate column" — khi đó bỏ qua file này).
ALTER TABLE ec_posts ADD COLUMN "chu_dau_tu" TEXT;
ALTER TABLE ec_posts ADD COLUMN "dia_chi" TEXT;
ALTER TABLE ec_posts ADD COLUMN "nam_hoan_thanh" TEXT;
ALTER TABLE ec_posts ADD COLUMN "quy_mo" TEXT;
ALTER TABLE ec_posts ADD COLUMN "gallery" JSON;
