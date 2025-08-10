# Frontend (`java_fe`)

Đây là dự án giao diện người dùng (Frontend) cho hệ thống của bạn. Dự án sử dụng TypeScript là ngôn ngữ chính, với một phần nhỏ CSS để tạo kiểu, phù hợp cho các ứng dụng web hiện đại.

## Công nghệ sử dụng

- **TypeScript** (~88.7%): Giúp phát triển ứng dụng mạnh mẽ, dễ bảo trì.
- **CSS** (~10.7%): Tùy chỉnh giao diện và trải nghiệm người dùng.
- **Khác** (~0.6%): Một số tệp cấu hình hoặc tài nguyên bổ trợ.

## Cấu trúc dự án

```plaintext
java_fe/
├── src/            # Mã nguồn TypeScript chính
├── public/         # Tài nguyên tĩnh (ảnh, favicon, ...)
├── styles/         # Tệp CSS hoặc SCSS
├── package.json    # Thông tin, dependency & script npm/yarn
├── tsconfig.json   # Cấu hình TypeScript
└── ...             # Các file cấu hình, README, v.v.
```

## Cài đặt & chạy thử

```bash
# Cài đặt phụ thuộc
npm install

# Chạy ứng dụng (ví dụ với Vite/Next/React)
npm run dev
```

## Build production

```bash
npm run build
```

## Đóng góp

Chào mừng mọi đóng góp! Vui lòng tạo pull request hoặc issues để thảo luận thêm.
