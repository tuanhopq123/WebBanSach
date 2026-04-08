// Cart page logic
import { getCart, updateCartItem, clearCart } from '../api.js';

function currency(n){ return n!=null ? n.toLocaleString() + '₫' : ''; }

function showToast(msg, type = 'success') {
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';

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

async function renderCart(){
  const root = document.getElementById('cart-root');
  if (!root) return;
  
  root.innerHTML = '<div class="text-center py-5 text-muted">Đang tải dữ liệu...</div>';
  
  try{
    const res = await getCart();
    const cart = (res && res.data) ? res.data : (Array.isArray(res)? res : (res && res.cart ? res.cart : null));
    
    if (!cart || !cart.items || cart.items.length === 0){
      root.innerHTML = `
        <div class="cart-card text-center py-5">
          <h1 class="display-3 mb-3">🛒</h1>
          <h4 class="fw-bold mb-3">Giỏ hàng của bạn đang trống</h4>
          <p class="text-muted mb-4">Hãy tiếp tục khám phá những cuốn sách tuyệt vời nhé!</p>
          <a href="/" class="btn btn-primary px-4 py-2 fw-semibold rounded-pill">Về Cửa Hàng</a>
        </div>
      `;
      return;
    }

    let grand = 0;
    const itemsHtml = cart.items.map(item => {
      const title = item.book? (item.book.title || '') : (item.title||'');
      const author = item.book? (item.book.author || '') : '';
      const imgUrl = (item.book && item.book.images && item.book.images[0]) ? 
                     (item.book.images[0].startsWith('/')? item.book.images[0] : '/uploads/'+item.book.images[0]) : 
                     'https://via.placeholder.com/60x80?text=No+Img';
      const price = item.book? (item.book.discountedPrice || item.book.price || 0) : (item.price||0);
      const qty = item.quantity || 1;
      const originalPriceHtml = (item.book && item.book.discountedPrice && item.book.discountedPrice < item.book.price) 
        ? `<div class="small text-muted text-decoration-line-through">${currency(item.book.price)}</div>` : '';
      const line = price * qty;
      const bId = item.book ? item.book._id : item.bookId;
      grand += line;

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img src="${imgUrl}" style="width:60px;height:80px;object-fit:cover;border-radius:8px;" class="shadow-sm">
              <div>
                <a href="/book.html?id=${bId}" class="fw-bold text-dark text-decoration-none d-block mb-1">${title}</a>
                <span class="small text-muted">${author}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="fw-semibold">${currency(price)}</div>
            ${originalPriceHtml}
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <button class="qty-btn btn-decr" data-id="${bId}">-</button>
              <input class="qty-input" value="${qty}" readonly />
              <button class="qty-btn btn-incr" data-id="${bId}">+</button>
            </div>
          </td>
          <td class="text-danger fw-bold text-end">${currency(line)}</td>
        </tr>
      `;
    }).join('');

    root.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="cart-card px-4 py-2">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style="width:45%">Sản phẩm</th>
                  <th style="width:20%">Đơn giá</th>
                  <th style="width:20%">Số lượng</th>
                  <th class="text-end" style="width:15%">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="border-top pt-3 mt-3">
              <button id="clear-cart" class="btn btn-outline-danger fw-semibold"><i class="me-1">🗑️</i> Xóa toàn bộ giỏ hàng</button>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="summary-card shadow-sm sticky-top" style="top:2rem;">
            <h5 class="fw-bold mb-4">Tóm tắt đơn hàng</h5>
            <div class="d-flex justify-content-between mb-3 text-secondary">
              <span>Tạm tính</span>
              <span class="fw-semibold">${currency(grand)}</span>
            </div>
            <div class="d-flex justify-content-between mb-3 text-secondary">
              <span>Phí giao hàng</span>
              <span class="fw-semibold">Miễn phí</span>
            </div>
            <hr class="my-4" style="border-color:#cbd5e1;">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <span class="fw-bold fs-5">Tổng cộng</span>
              <span class="text-danger fw-black fs-4">${currency(grand)}</span>
            </div>
            <a href="/checkout.html" class="btn btn-checkout w-100 d-flex justify-content-center align-items-center gap-2">
              TIẾN HÀNH THANH TOÁN <span>→</span>
            </a>
            <div class="text-center mt-3 small text-muted">
              🛡️ Giao dịch mua hàng an toàn & bảo mật
            </div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-decr').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const inp = e.target.nextElementSibling;
        const v = Math.max(1, Number(inp.value||1)-1);
        if (v.toString() !== inp.value) {
            inp.value = v;
            showToast('Đang cập nhật...', 'success');
            await saveQty(id, v); renderCart(); 
        }
    }));

    document.querySelectorAll('.btn-incr').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const inp = e.target.previousElementSibling;
        const v = Math.max(1, Number(inp.value||1)+1);
        inp.value = v;
        showToast('Đang cập nhật...', 'success');
        await saveQty(id, v); renderCart(); 
    }));

    document.getElementById('clear-cart').addEventListener('click', async ()=>{ 
        if(!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return; 
        try {
            await clearCart(); 
            renderCart(); 
        } catch(err) {
            showToast('Xóa lỗi', 'error');
        }
    });

  }catch(err){
    console.error(err);
    root.innerHTML = `
      <div class="cart-card text-center py-5">
        <h4 class="text-danger fw-bold">❌ Không thể tải giỏ hàng</h4>
        <p class="text-muted">Vui lòng đăng nhập hoặc thử lại sau.</p>
        <a href="/login.html" class="btn btn-primary px-4 py-2 mt-2 rounded-pill">Đăng Nhập</a>
      </div>
    `;
  }
}

async function saveQty(bookId, qty){
  try{
    await updateCartItem({ bookId, quantity: qty });
  }catch(err){ console.warn('Không lưu được số lượng', err); }
}

document.addEventListener('DOMContentLoaded', ()=>{ renderCart(); });
