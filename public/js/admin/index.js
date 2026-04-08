document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('admin-index-root');
    if (!root) return;
  
    root.innerHTML = `
      <style>
        .header-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius:16px;padding:2rem;color:#fff;margin-bottom:2rem;
          box-shadow:0 8px 30px rgba(15,23,42,.35);
        }
        .widget-card {
          border-radius: 16px;
          border: none;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          color: white;
          text-decoration: none;
          padding: 1.5rem;
          display: block;
        }
        .widget-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,.15);
          color: white;
        }
        .w-books { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
        .w-cats { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .w-orders { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        .w-users { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .w-discounts { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
      </style>
  
      <div>
        <!-- Header -->
        <div class="header-card text-center">
          <h2 class="fw-bold mb-2">Xin chào Quản trị viên 👋</h2>
          <p class="mb-0 opacity-75">Tóm tắt các chức năng quản trị nhanh chóng</p>
        </div>
  
        <!-- Widgets -->
        <div class="row g-4 justify-content-center">
          <div class="col-md-4 col-sm-6">
            <a href="books.html" class="widget-card w-books shadow">
              <h1 class="mb-2">📖</h1>
              <h5 class="fw-bold mb-1">Quản lý Sách</h5>
              <p class="mb-0 small opacity-75">Thêm, sửa, xóa các đầu sách</p>
            </a>
          </div>
          <div class="col-md-4 col-sm-6">
            <a href="categories.html" class="widget-card w-cats shadow">
              <h1 class="mb-2">📂</h1>
              <h5 class="fw-bold mb-1">Danh mục</h5>
              <p class="mb-0 small opacity-75">Phân loại thể loại sách</p>
            </a>
          </div>
          <div class="col-md-4 col-sm-6">
            <a href="orders.html" class="widget-card w-orders shadow">
              <h1 class="mb-2">🛒</h1>
              <h5 class="fw-bold mb-1">Đơn hàng</h5>
              <p class="mb-0 small opacity-75">Tra cứu đơn mua sách</p>
            </a>
          </div>
          <div class="col-md-4 col-sm-6">
            <a href="users.html" class="widget-card w-users shadow">
              <h1 class="mb-2">👥</h1>
              <h5 class="fw-bold mb-1">Người dùng</h5>
              <p class="mb-0 small opacity-75">Quản lý tài khoản, vai trò</p>
            </a>
          </div>
          <div class="col-md-4 col-sm-6">
            <a href="discounts.html" class="widget-card w-discounts shadow">
              <h1 class="mb-2">🏷️</h1>
              <h5 class="fw-bold mb-1">Giảm giá</h5>
              <p class="mb-0 small opacity-75">Tạo các voucher khuyến mãi</p>
            </a>
          </div>
        </div>
      </div>
    `;
  });
  
