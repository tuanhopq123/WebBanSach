import { apiGet, getMyOrders, createReview, getMyReviews, updateReview } from '../api.js';

function currency(n) { return n != null ? n.toLocaleString() + '₫' : ''; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type = 'success') {
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1055;';

  const toast = document.createElement('div');
  toast.style.cssText = `
      background: ${type === 'success' ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#e83e8c)'};
      color:#fff; padding:14px 20px; border-radius:12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.3); font-size:14px; font-weight:500;
      animation: slideInRight .35s ease; min-width:260px;
    `;
  toast.textContent = msg;
  container.appendChild(toast);
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('profile-root');
  if (!root) return;

  try {
    const res = await apiGet('/api/users/profile');
    const user = (res && res.data) ? res.data : null;

    if (!user) {
      root.innerHTML = `
          <div class="card border-0 shadow-sm text-center py-5 rounded-4">
            <h4 class="mb-3">Vui lòng đăng nhập để xem thông tin cá nhân</h4>
            <a href="/login.html" class="btn btn-primary px-4 rounded-pill m-auto shadow-sm">Đến trang đăng nhập</a>
          </div>
        `;
      return;
    }

    const roleName = (typeof user.role === 'object' && user.role !== null) ? (user.role.name || 'Khách hàng') : (user.role || 'Khách hàng');
    const isAdmin = roleName === 'Admin' || roleName === 'Staff';

    // Giao diện thẻ Profile Header dùng chung
    const adminBtnHTML = isAdmin ? `<a href="/admin/index.html" class="btn btn-light fw-bold text-primary mt-3 shadow-sm rounded-pill px-4">⚙️ Vào Trang Quản Trị</a>` : '';

    // ĐIỀU HƯỚNG UI BÊN PHẢI THEO ROLE
    let rightColumnHeader = isAdmin
      ? `<ul class="nav nav-pills mb-4 d-flex justify-content-between align-items-center border-bottom pb-3">
           <li class="nav-item"><a class="nav-link active bg-danger fw-bold" href="javascript:void(0)">📦 5 Đơn Hàng Mới Nhất Hệ Thống</a></li>
           <li><a href="/admin/users.html" class="btn btn-outline-primary fw-bold px-4 rounded-pill">👥 Quản Lý User</a></li>
         </ul>`
      : `<ul class="nav nav-pills mb-4 d-flex justify-content-between align-items-center border-bottom pb-3">
           <li class="nav-item"><a class="nav-link active fw-bold" href="javascript:void(0)">📦 5 Đơn Hàng Gần Nhất Của Bạn</a></li>
           <li><a href="/my-orders.html" class="btn btn-outline-primary fw-bold px-4 rounded-pill">Xem Tất Cả Lịch Sử →</a></li>
         </ul>`;

    root.innerHTML = `
      <div class="row">
        <div class="col-lg-4 mb-4">
          <div class="profile-header-card text-center d-flex flex-column align-items-center">
            <div class="profile-avatar mb-3">${user.username ? user.username.charAt(0).toUpperCase() : '👤'}</div>
            <h4 class="fw-bold mb-1">${user.username || user.email}</h4>
            <div class="opacity-75 small mb-3">Thành viên Bookstore</div>
            <div class="bg-white bg-opacity-10 rounded-3 p-3 w-100 text-start">
              <div class="d-flex justify-content-between mb-2">
                <span class="opacity-75">Email</span><span class="fw-semibold">${user.email}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="opacity-75">Vai trò</span><span class="fw-semibold bg-white text-primary px-2 rounded small">${roleName}</span>
              </div>
            </div>
            ${adminBtnHTML}
          </div>
        </div>
        <div class="col-lg-8">
          ${rightColumnHeader}
          <div id="orders-container"><div class="text-center text-muted py-4">Đang tải dữ liệu...</div></div>
        </div>
      </div>
    `;

    const ordersContainer = document.getElementById('orders-container');

    // ==========================================
    // LUỒNG DÀNH RIÊNG CHO ADMIN / STAFF
    // ==========================================
    if (isAdmin) {
      try {
        const ordRes = await apiGet('/api/orders'); // Lấy đơn hàng toàn hệ thống
        const allOrders = (ordRes && ordRes.data) ? ordRes.data : [];
        const top5Orders = allOrders.slice(0, 5);

        if (top5Orders.length === 0) {
          ordersContainer.innerHTML = `<div class="text-center py-5 bg-white rounded-4 shadow-sm border"><p class="text-muted mb-0">Hệ thống chưa có đơn hàng nào.</p></div>`;
        } else {
          ordersContainer.innerHTML = top5Orders.map(ord => {
            return `
                  <div class="order-card p-4 mb-3 bg-white rounded-4 shadow-sm border border-opacity-25" style="border-color: #cbd5e1;">
                      <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                          <span class="fw-bold fs-6 text-primary">Đơn #${ord._id.slice(-8)}</span>
                          <span class="badge ${ord.status === 'Pending' ? 'bg-warning text-dark' : 'bg-primary'} px-3 py-2 rounded-pill">${ord.status}</span>
                      </div>
                      <div class="row">
                        <div class="col-6 mb-2"><small class="text-muted d-block">Khách hàng</small><strong>${ord.user?.username || ord.user?.email || 'Ẩn danh'}</strong></div>
                        <div class="col-6 mb-2"><small class="text-muted d-block">Thời gian đặt</small><strong>${fmtDate(ord.createdAt)}</strong></div>
                        <div class="col-6"><small class="text-muted d-block">Thanh toán</small><strong>${ord.paymentMethod}</strong></div>
                        <div class="col-6"><small class="text-muted d-block">Tổng tiền</small><strong class="text-danger fs-5">${currency(ord.totalAmount)}</strong></div>
                      </div>
                      <div class="mt-3 text-end">
                        <a href="/admin/orders.html" class="btn btn-sm btn-dark px-4 rounded-pill">Quản lý chi tiết →</a>
                      </div>
                  </div>
                `;
          }).join('');
        }
      } catch (err) {
        ordersContainer.innerHTML = `<div class="alert alert-danger shadow-sm">❌ Không tải được danh sách đơn hàng hệ thống.</div>`;
      }
    }
    // ==========================================
    // LUỒNG DÀNH RIÊNG CHO USER CƠ BẢN
    // ==========================================
    else {
      try {
        const [ordRes, revRes] = await Promise.all([getMyOrders(), getMyReviews()]);
        const orders = (ordRes && ordRes.data) ? ordRes.data : (Array.isArray(ordRes) ? ordRes : []);
        const myReviews = (revRes && revRes.data) ? revRes.data : [];

        const top5CustomerOrders = orders.slice(0, 5);

        if (!top5CustomerOrders || top5CustomerOrders.length === 0) {
          ordersContainer.innerHTML = `
            <div class="text-center py-5 bg-white rounded-4 shadow-sm border" style="border-color:#f1f5f9;">
              <div class="fs-1 mb-2">🛍️</div><h5 class="fw-bold text-dark">Bạn chưa có đơn hàng nào</h5>
              <p class="text-muted">Cửa hàng của chúng tôi có rất nhiều cuốn sách hay đang chờ bạn.</p>
              <a href="/" class="btn btn-outline-primary px-4 rounded-pill">Tiếp tục mua sắm</a>
            </div>
          `;
        } else {
          ordersContainer.innerHTML = top5CustomerOrders.map(ord => {
            const statusColors = {
              'Pending': 'bg-warning text-dark', 'Processing': 'bg-info text-dark',
              'Shipped': 'bg-primary', 'Completed': 'bg-success', 'Delivered': 'bg-success', 'Cancelled': 'bg-danger'
            };
            const statClass = statusColors[ord.status] || 'bg-secondary';

            let itemsHtml = '';
            if (ord.items && ord.items.length > 0) {
              itemsHtml = ord.items.map(item => {
                const bId = item.book ? (item.book._id || item.book.id) : null;
                const bTitle = item.book ? item.book.title : 'Sách không còn tồn tại';
                const bImg = (item.book && item.book.images && item.book.images[0])
                  ? (item.book.images[0].startsWith('/') ? item.book.images[0] : '/uploads/' + item.book.images[0])
                  : 'https://via.placeholder.com/48x64?text=No+Img';

                const existingReview = myReviews.find(r => r.book && (r.book._id === bId || r.book.id === bId) && r.orderId === ord._id);

                let reviewBtn = '';
                if (ord.status === 'Delivered' && bId) {
                  if (existingReview) {
                    reviewBtn = `<button class="btn btn-outline-secondary btn-sm btn-review fw-semibold" 
                            data-book-id="${bId}" data-order-id="${ord._id}" data-review-id="${existingReview._id}"
                            data-rating="${existingReview.rating}" data-comment="${existingReview.comment ? existingReview.comment.replace(/"/g, '&quot;') : ''}"
                            data-book-title="${bTitle.replace(/"/g, '&quot;')}" data-book-img="${bImg}">✏️ Sửa Đánh Giá</button>`;
                  } else {
                    reviewBtn = `<button class="btn btn-primary btn-sm btn-review fw-semibold shadow-sm" 
                            data-book-id="${bId}" data-order-id="${ord._id}"
                            data-book-title="${bTitle.replace(/"/g, '&quot;')}" data-book-img="${bImg}">✍️ Đánh giá</button>`;
                  }
                }

                return `
                    <div class="item-card d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-light">
                      <div class="d-flex align-items-center gap-3">
                          <img src="${bImg}" class="rounded shadow-sm" style="width:40px; height:56px; object-fit:contain; background:#fff;">
                          <div>
                              <a href="${bId ? '/book.html?id=' + bId : '#'}" class="fw-semibold text-dark text-decoration-none d-block">${bTitle}</a>
                              <span class="small text-muted">Số lượng: ${item.quantity} | Giá: ${currency(item.price)}</span>
                          </div>
                      </div>
                      <div>${reviewBtn}</div>
                    </div>
                  `;
              }).join('');
            }

            return `
              <div class="order-card border shadow-sm rounded-4 p-4 mb-3" style="border-color:#cbd5e1;">
                <div class="order-header d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
                  <div>
                    <span class="text-muted small">Đơn hàng #<span class="fw-bold text-dark">${ord._id || ord.id}</span></span>
                    <div class="small mt-1 text-muted">Đặt lúc: ${fmtDate(ord.createdAt)}</div>
                  </div>
                  <span class="badge ${statClass} px-3 py-2 rounded-pill">${ord.status === 'Delivered' ? 'Giao thành công' : ord.status === 'Pending' ? 'Chờ xử lý' : ord.status}</span>
                </div>
                <div class="mb-3">${itemsHtml}</div>
                <div class="d-flex justify-content-between align-items-center pt-2">
                  <div class="text-muted small">Thanh toán: <span class="fw-semibold text-dark">${ord.paymentMethod}</span></div>
                  <div class="text-end">
                    <span class="text-muted small">Tổng thanh toán:</span><span class="fw-bold text-danger ms-2 fs-5">${currency(ord.totalAmount)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        ordersContainer.innerHTML = `<div class="alert alert-danger shadow-sm">❌ Không tải được danh sách đơn hàng cá nhân.</div>`;
      }
    }
  } catch (err) {
    root.innerHTML = '<div class="alert alert-danger my-5 shadow-sm">❌ Cần đăng nhập lại để xem hồ sơ. Lỗi hệ thống.</div>';
  }
});

// ==========================================
// LOGIC MODAL ĐÁNH GIÁ (CHỈ DÀNH CHO USER)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.btn-review')) {
      const btn = e.target.closest('.btn-review');
      document.getElementById('review-book-id').value = btn.dataset.bookId;
      document.getElementById('review-order-id').value = btn.dataset.orderId;
      document.getElementById('review-update-id').value = btn.dataset.reviewId || '';

      document.getElementById('review-book-info').innerHTML = `
                <img src="${btn.dataset.bookImg}" style="width:48px;height:64px;object-fit:cover;border-radius:6px;" class="shadow-sm">
                <div>
                    <div class="fw-semibold text-dark">${btn.dataset.bookTitle}</div>
                    <div class="small text-muted">Đơn hàng: #${btn.dataset.orderId}</div>
                </div>
            `;

      document.getElementById('review-rating').value = btn.dataset.rating || "5";
      document.getElementById('review-comment').value = btn.dataset.comment || "";
      document.getElementById('reviewModalLabel').textContent = btn.dataset.reviewId ? "✏️ Cập nhật đánh giá" : "🌟 Đánh giá sản phẩm";
      document.querySelector('#profile-review-form button[type="submit"]').textContent = btn.dataset.reviewId ? "CẬP NHẬT TRẢI NGHIỆM" : "GỬI ĐÁNH GIÁ";

      const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
      reviewModal.show();
    }
  });

  const reviewForm = document.getElementById('profile-review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookId = document.getElementById('review-book-id').value;
      const orderId = document.getElementById('review-order-id').value;
      const reviewId = document.getElementById('review-update-id').value;
      const rating = Number(document.getElementById('review-rating').value);
      const comment = document.getElementById('review-comment').value.trim();

      const btn = e.target.querySelector('button[type="submit"]');
      const origText = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = 'ĐANG GỬI...';

      try {
        if (reviewId) {
          await updateReview(reviewId, { rating, comment });
          showToast('Đã cập nhật đánh giá thành công! 🌟', 'success');
        } else {
          await createReview({ bookId, orderId, rating, comment });
          showToast('Cảm ơn bạn đã đánh giá! Nhận xét đã được lưu. 🌟', 'success');
        }

        const modEl = document.getElementById('reviewModal');
        const modalInstance = bootstrap.Modal.getInstance(modEl);
        if (modalInstance) modalInstance.hide();
        setTimeout(() => { window.location.reload(); }, 1000);
      } catch (err) {
        showToast('Chưa thể gửi đánh giá: ' + (err.message || ''), 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = origText;
      }
    });
  }
});