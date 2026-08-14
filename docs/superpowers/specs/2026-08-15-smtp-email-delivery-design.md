# Thiết kế Tích hợp Plugin SMTP Gửi Email Đăng nhập (Gmail SMTP)

## 1. Tổng quan & Mục tiêu
- **Mục tiêu**: Thay thế plugin `cloudflareEmail` hiện tại bằng `emdash-plugin-smtp` (sử dụng thông tin tài khoản SMTP Gmail từ dự án `KhongMinhGiaKinhDich`) trong dự án `AVC`.
- **Mục đích sử dụng**: Phục vụ gửi email xác thực đăng nhập (magic link / OTP) và các email hệ thống từ EmDash CMS.

## 2. Kiến trúc & Thành phần

### A. Gói nội bộ `packages/emdash-plugin-smtp`
Sao chép và thiết lập plugin SMTP nội bộ trong thư mục `packages/emdash-plugin-smtp`:
1. `package.json`:
   - Tên gói: `emdash-plugin-smtp`
   - Exports: `.` (`./src/index.ts`) và `./sandbox` (`./src/sandbox-entry.ts`).
2. `tsconfig.json`:
   - Kế thừa từ `tsconfig.json` gốc, cấu hình module `NodeNext`.
3. `src/index.ts`:
   - Hàm `smtpPlugin()` trả về `PluginDescriptor` với capabilities `hooks.email-transport:register`, `network:request` và allowedHosts `["smtp.gmail.com"]`.
4. `src/sandbox-entry.ts`:
   - Triển khai hook độc quyền `email:deliver`.
   - Xử lý socket SMTP qua TLS port 465 tương thích cả môi trường Node.js (`node:tls`) khi dev và Cloudflare Workers (`cloudflare:sockets`) khi deploy.
   - Thông tin xác thực Gmail SMTP:
     - **Host**: `smtp.gmail.com`
     - **Port**: `465`
     - **Username / Sender**: `khietvidai@gmail.com`
     - **App Password**: `xxhq ykiq phrc pjgj`

### B. Cấu hình dự án `AVC`
1. `package.json`:
   - Thêm dependency `"emdash-plugin-smtp": "file:./packages/emdash-plugin-smtp"`.
2. `astro.config.mjs`:
   - Bỏ import và khai báo `cloudflareEmail`.
   - Import `smtpPlugin` từ `emdash-plugin-smtp`.
   - Đưa `smtpPlugin()` vào danh sách `plugins` của `emdash({...})`.

## 3. Luồng dữ liệu (Data Flow)
1. Người dùng nhập email tại trang đăng nhập admin `/_emdash/admin`.
2. EmDash CMS tạo token magic link / OTP và kích hoạt hook `email:deliver`.
3. `emdash-plugin-smtp` kết nối TLS tới `smtp.gmail.com:465`.
4. Thực hiện chuỗi lệnh SMTP chuẩn (`EHLO`, `AUTH LOGIN`, gửi credentials Base64, `MAIL FROM`, `RCPT TO`, `DATA`, `QUIT`).
5. Gmail SMTP tiếp nhận và gửi email tới hòm thư người dùng.

## 4. Kế hoạch kiểm thử & Xác thực
1. Cài đặt dependencies: chạy `pnpm install` để link package cục bộ.
2. Kiểm tra typecheck: chạy `pnpm run typecheck` đảm bảo không có lỗi TypeScript hay build syntax.
3. Xác minh cấu hình: kiểm tra `astro.config.mjs` nạp đúng `smtpPlugin()`.
