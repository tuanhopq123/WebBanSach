# Hướng Dẫn Test API WebBanSach Trên POSTMAN

## Tổng Quan
Ứng dụng WebBanSach là một hệ thống bán sách trực tuyến với các vai trò chính: **Customer** (Khách hàng) và **Admin** (Quản trị viên). Hướng dẫn này cung cấp các bước test chi tiết cho từng vai trò sử dụng POSTMAN.

**Base URL:** `http://localhost:5000/api`

**Authentication:** Sử dụng JWT token. Sau khi đăng nhập, thêm header:
- Key: `Authorization`
- Value: `Bearer <token>`

## 1. Chuẩn Bị Dữ Liệu Test
Trước khi test, đảm bảo database có dữ liệu mẫu. Chạy seed nếu cần:
```bash
npm run seed
```

## 2. Vai Trò Customer (Khách Hàng)

### 2.1 Đăng Ký Tài Khoản
- **Method:** POST
- **URL:** `/users/register`
- **Body (JSON):**
```json
{
  "username": "customer1",
  "email": "customer1@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC, TP.HCM"
}
```
- **Expected Response:** 201 Created, trả về user info (không có password)

### 2.2 Đăng Nhập
- **Method:** POST
- **URL:** `/users/login`
- **Body (JSON):**
```json
{
  "email": "customer1@example.com",
  "password": "password123"
}
```
- **Expected Response:** 200 OK, trả về token. Lưu token để sử dụng cho các request sau.

### 2.3 Lấy Thông Tin Profile
- **Method:** GET
- **URL:** `/users/profile`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK, thông tin user

### 2.4 Xem Tất Cả Sách
- **Method:** GET
- **URL:** `/books`
- **Expected Response:** 200 OK, danh sách sách

### 2.5 Xem Chi Tiết Sách
- **Method:** GET
- **URL:** `/books/<book_id>`
- **Expected Response:** 200 OK, chi tiết sách

### 2.6 Xem Tất Cả Danh Mục
- **Method:** GET
- **URL:** `/categories`
- **Expected Response:** 200 OK, danh sách danh mục

### 2.7 Thêm Sách Vào Giỏ Hàng
- **Method:** POST
- **URL:** `/cart`
- **Headers:** Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "bookId": "<book_id>",
  "quantity": 2
}
```
- **Expected Response:** 200 OK, giỏ hàng được cập nhật

### 2.8 Xem Giỏ Hàng
- **Method:** GET
- **URL:** `/cart`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK, danh sách items trong giỏ

### 2.9 Cập Nhật Số Lượng Trong Giỏ
- **Method:** PUT
- **URL:** `/cart/update`
- **Headers:** Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "bookId": "<book_id>",
  "quantity": 1
}
```
- **Expected Response:** 200 OK

### 2.10 Xóa Giỏ Hàng
- **Method:** DELETE
- **URL:** `/cart`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK

### 2.11 Checkout (Đặt Hàng)
- **Method:** POST
- **URL:** `/orders/checkout`
- **Headers:** Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "shippingAddress": "456 Đường XYZ, Hà Nội",
  "paymentMethod": "COD"z
}
```
- **Expected Response:** 201 Created, thông tin đơn hàng

### 2.12 Xem Đơn Hàng Của Tôi
- **Method:** GET
- **URL:** `/orders/my-orders`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK, danh sách đơn hàng

### 2.13 Xem Chi Tiết Đơn Hàng
- **Method:** GET
- **URL:** `/orders/<order_id>`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK, chi tiết đơn hàng

### 2.14 Xem Đánh Giá Của Sách
- **Method:** GET
- **URL:** `/reviews/book/<book_id>`
- **Expected Response:** 200 OK, danh sách đánh giá

### 2.15 Tạo Đánh Giá
- **Method:** POST
- **URL:** `/reviews`
- **Headers:** Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "bookId": "<book_id>",
  "rating": 5,
  "comment": "Sách rất hay!"
}
```
- **Expected Response:** 201 Created

### 2.16 Xem Đánh Giá Của Tôi
- **Method:** GET
- **URL:** `/reviews/my-reviews`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK, danh sách đánh giá

### 2.17 Cập Nhật Đánh Giá
- **Method:** PUT
- **URL:** `/reviews/<review_id>`
- **Headers:** Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "rating": 4,
  "comment": "Sách hay, nhưng bìa hơi cũ"
}
```
- **Expected Response:** 200 OK

### 2.18 Xóa Đánh Giá
- **Method:** DELETE
- **URL:** `/reviews/<review_id>`
- **Headers:** Authorization: Bearer <token>
- **Expected Response:** 200 OK

## 3. Vai Trò Admin (Quản Trị Viên)

### 3.1 Đăng Nhập Admin
- **Method:** POST
- **URL:** `/users/login`
- **Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
- **Expected Response:** 200 OK, trả về token Admin

### 3.2 Quản Lý Người Dùng

#### Xem Tất Cả Người Dùng
- **Method:** GET
- **URL:** `/users`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK, danh sách users

#### Xem Chi Tiết Người Dùng
- **Method:** GET
- **URL:** `/users/<user_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

#### Cập Nhật Người Dùng
- **Method:** PUT
- **URL:** `/users/<user_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "fullName": "Tên Mới",
  "phone": "0987654321"
}
```
- **Expected Response:** 200 OK

#### Xóa Người Dùng
- **Method:** DELETE
- **URL:** `/users/<user_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

### 3.3 Quản Lý Sách

#### Thêm Sách Mới
- **Method:** POST
- **URL:** `/books`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "title": "Sách Mới",
  "author": "Tác Giả",
  "price": 50000,
  "description": "Mô tả sách",
  "categoryId": "<category_id>",
  "stock": 100
}
```
- **Expected Response:** 201 Created

#### Cập Nhật Sách
- **Method:** PUT
- **URL:** `/books/<book_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "price": 55000,
  "stock": 95
}
```
- **Expected Response:** 200 OK

#### Xóa Sách
- **Method:** DELETE
- **URL:** `/books/<book_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

#### Upload Ảnh Cho Sách
- **Method:** POST
- **URL:** `/books/<book_id>/upload`
- **Headers:** Authorization: Bearer <admin_token>
- **Body:** Form-data, key: `image`, value: file ảnh
- **Expected Response:** 200 OK

### 3.4 Quản Lý Danh Mục

#### Thêm Danh Mục
- **Method:** POST
- **URL:** `/categories`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "name": "Danh Mục Mới",
  "description": "Mô tả danh mục"
}
```
- **Expected Response:** 201 Created

#### Cập Nhật Danh Mục
- **Method:** PUT
- **URL:** `/categories/<category_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "name": "Tên Mới"
}
```
- **Expected Response:** 200 OK

#### Xóa Danh Mục
- **Method:** DELETE
- **URL:** `/categories/<category_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

### 3.5 Quản Lý Giảm Giá

#### Xem Tất Cả Giảm Giá
- **Method:** GET
- **URL:** `/discounts`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

#### Thêm Giảm Giá
- **Method:** POST
- **URL:** `/discounts`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "code": "SALE10",
  "discountPercentage": 10,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```
- **Expected Response:** 201 Created

#### Áp Dụng Giảm Giá Cho Sách
- **Method:** POST
- **URL:** `/discounts/<discount_id>/apply`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "bookIds": ["<book_id1>", "<book_id2>"]
}
```
- **Expected Response:** 200 OK

#### Gỡ Giảm Giá Khỏi Sách
- **Method:** POST
- **URL:** `/discounts/<discount_id>/remove`
- **Headers:** Authorization: Bearer <admin_token>
- **Body (JSON):**
```json
{
  "bookIds": ["<book_id1>"]
}
```
- **Expected Response:** 200 OK

### 3.6 Quản Lý Ảnh

#### Upload Ảnh
- **Method:** POST
- **URL:** `/images/upload`
- **Headers:** Authorization: Bearer <admin_token>
- **Body:** Form-data, key: `image`, value: file ảnh
- **Expected Response:** 200 OK

#### Xem Ảnh Của Sách
- **Method:** GET
- **URL:** `/images/book/<book_id>`
- **Expected Response:** 200 OK

#### Xóa Ảnh
- **Method:** DELETE
- **URL:** `/images/<image_id>`
- **Headers:** Authorization: Bearer <admin_token>
- **Expected Response:** 200 OK

## 4. Lưu Ý Quan Trọng
- Luôn thêm header `Authorization: Bearer <token>` cho các request yêu cầu authentication
- Thay thế `<id>` bằng ID thực tế từ response trước đó
- Đảm bảo server đang chạy trên port 5000
- Một số request có validation, đảm bảo dữ liệu đúng format
- Admin có thể làm mọi thứ Customer làm, nhưng ngược lại thì không

## 5. Xử Lý Lỗi Thường Gặp
- **401 Unauthorized:** Token không hợp lệ hoặc hết hạn
- **403 Forbidden:** Không đủ quyền (ví dụ Customer truy cập Admin routes)
- **400 Bad Request:** Dữ liệu không hợp lệ
- **404 Not Found:** Resource không tồn tại
- **500 Internal Server Error:** Lỗi server, kiểm tra console

## 6. Import Collection Vào POSTMAN
Bạn có thể tạo collection trong POSTMAN và import các request trên theo từng folder Customer và Admin để dễ quản lý.

## 7. Mô phỏng Thanh toán (Local testing)
Khi chạy trên môi trường local, bạn có thể tạo đơn hàng bằng `POST /api/orders/checkout` rồi dùng endpoint mô phỏng thanh toán để đánh dấu đơn là đã thanh toán (thay cho Webhook từ cổng thanh toán).

- **Tạo đơn hàng (checkout):**
  - Method: POST
  - URL: `/api/orders/checkout`
  - Headers: `Authorization: Bearer <token>`
  - Body (JSON):
```json
{
  "shippingAddress": "456 Đường XYZ, Hà Nội",
  "paymentMethod": "BANK" // hoặc "COD"
}
```

- **Mô phỏng thanh toán (simulate):**
  - Method: POST
  - URL: `/api/payments/simulate`
  - Headers: `Authorization: Bearer <token>`
  - Body (JSON):
```json
{
  "orderId": "<order_id_received_from_checkout>"
}
```
  - Expected Response: 200 OK nếu thanh toán được mô phỏng thành công. Endpoint này sẽ gọi nội bộ `processCassoWebhook` để cập nhật `isPaid` và trừ kho hàng giống như webhook thực tế.

Ghi chú: `POST /api/webhook/casso` vẫn tồn tại để nhận Webhook thật từ Casso; endpoint `/api/payments/simulate` chỉ dành cho test local và yêu cầu `Authorization` (người dùng/khách hàng tạo đơn phải là chủ đơn hoặc admin).