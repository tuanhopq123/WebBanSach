import { getMyOrders, createReview, getMyReviews, updateReview } from '../api.js';

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
    toast.style.cssText = `background: ${type === 'success' ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#e83e8c)'}; color:#fff; padding:14px 20px; border-radius:12px; box-shadow: 0 8px 24px rgba(0,0,0,.3); font-size:14px; font-weight:500; animation: slideInRight .35s ease; min-width:260px;`;
    toast.textContent = msg;
    container.appendChild(toast);
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3500);
}

let allOrders = [];
let allReviews = [];

async function loadOrders() {
    const root = document.getElementById('full-orders-root');
    try {
        const ordRes = await getMyOrders();
        allOrders = (ordRes && ordRes.data) ? ordRes.data : (Array.isArray(ordRes) ? ordRes : []);

        const revRes = await getMyReviews();
        allReviews = (revRes && revRes.data) ? revRes.data : [];

        renderOrders('All');
    } catch (err) {
        root.innerHTML = '<div class="alert alert-danger shadow-sm text-center py-4">❌ Không thể tải danh sách đơn hàng. Vui lòng đăng nhập lại.</div>';
    }
}

function renderOrders(filterStatus) {
    const root = document.getElementById('full-orders-root');

    let filteredOrders = allOrders;
    if (filterStatus !== 'All') {
        filteredOrders = allOrders.filter(o => o.status === filterStatus);
    }

    if (!filteredOrders || filteredOrders.length === 0) {
        root.innerHTML = `
          <div class="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <div class="fs-1 mb-2">📭</div>
            <h5 class="fw-bold text-dark">Chưa có đơn hàng nào ở trạng thái này</h5>
          </div>
        `;
        return;
    }

    root.innerHTML = filteredOrders.map(ord => {
        const statusColors = {
            'Pending': 'bg-warning text-dark', 'Processing': 'bg-info text-dark',
            'Shipped': 'bg-primary', 'Delivered': 'bg-success', 'Cancelled': 'bg-danger'
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

                const existingReview = allReviews.find(r => r.book && (r.book._id === bId || r.book.id === bId) && r.orderId === ord._id);

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
                <div class="item-card d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${bImg}" class="rounded shadow-sm" style="width:45px; height:60px; object-fit:contain; background:#fff;">
                        <div>
                            <a href="${bId ? '/book.html?id=' + bId : '#'}" class="fw-bold text-dark text-decoration-none d-block">${bTitle}</a>
                            <span class="small text-muted">SL: ${item.quantity} | Giá: ${currency(item.price)}</span>
                        </div>
                    </div>
                    <div>${reviewBtn}</div>
                </div>`;
            }).join('');
        }

        return `
            <div class="order-card">
            <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div>
                <span class="text-muted small">Đơn hàng #<span class="fw-bold text-dark fs-6">${ord._id || ord.id}</span></span>
                <div class="small mt-1 text-muted">Đặt lúc: ${fmtDate(ord.createdAt)}</div>
                </div>
                <span class="badge ${statClass} px-3 py-2 rounded-pill fw-bold">${ord.status}</span>
            </div>
            <div class="mb-3">${itemsHtml}</div>
            <div class="d-flex justify-content-between align-items-center pt-2">
                <div class="text-muted small">Thanh toán: <span class="fw-bold text-dark">${ord.paymentMethod}</span></div>
                <div class="text-end">
                <span class="text-muted small">Tổng tiền:</span>
                <span class="fw-black text-danger ms-2 fs-4">${currency(ord.totalAmount)}</span>
                </div>
            </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();

    // Xử lý Tabs Filter
    const tabs = document.querySelectorAll('#orderFilters .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const status = tab.getAttribute('data-status');
            renderOrders(status);
        });
    });

    // Review Modal Logic
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn-review')) {
            const btn = e.target.closest('.btn-review');
            document.getElementById('review-book-id').value = btn.dataset.bookId;
            document.getElementById('review-order-id').value = btn.dataset.orderId;
            document.getElementById('review-update-id').value = btn.dataset.reviewId || '';

            document.getElementById('review-book-info').innerHTML = `
                <img src="${btn.dataset.bookImg}" style="width:48px;height:64px;object-fit:cover;border-radius:6px;" class="shadow-sm">
                <div>
                    <div class="fw-bold text-dark">${btn.dataset.bookTitle}</div>
                    <div class="small text-muted">Đơn hàng: #${btn.dataset.orderId}</div>
                </div>
            `;

            document.getElementById('review-rating').value = btn.dataset.rating || "5";
            document.getElementById('review-comment').value = btn.dataset.comment || "";
            document.getElementById('reviewModalLabel').textContent = btn.dataset.reviewId ? "✏️ Cập nhật đánh giá" : "🌟 Đánh giá sản phẩm";

            const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
            reviewModal.show();
        }
    });

    document.getElementById('profile-review-form').addEventListener('submit', async (e) => {
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
                showToast('Cập nhật đánh giá thành công! 🌟', 'success');
            } else {
                await createReview({ bookId, orderId, rating, comment });
                showToast('Nhận xét đã được lưu. 🌟', 'success');
            }

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            if (modalInstance) modalInstance.hide();
            setTimeout(() => { window.location.reload(); }, 1000);
        } catch (err) {
            showToast('Chưa thể gửi đánh giá: ' + (err.message || ''), 'error');
        } finally {
            btn.disabled = false; btn.innerHTML = origText;
        }
    });
});