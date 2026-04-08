import { getCart, checkoutOrder, simulatePayment } from '../api.js';

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

async function renderCheckout(){
  const root = document.getElementById('checkout-root');
  if (!root) return;
  
  try{
    const res = await getCart();
    const cart = (res && res.data) ? res.data : (Array.isArray(res)? res : (res && res.cart ? res.cart : null));
    if (!cart || !cart.items || cart.items.length===0){
      root.innerHTML = `
        <div class="checkout-card text-center py-5">
          <h1 class="display-3 mb-3">🛒</h1>
          <h4 class="fw-bold">Giỏ hàng của bạn đang trống!</h4>
          <p class="text-muted mb-4">Vui lòng thêm sản phẩm trước khi thanh toán.</p>
          <a href="/" class="btn btn-primary px-4 py-2 rounded-pill">Quay lại cửa hàng</a>
        </div>
      `;
      return;
    }

    let total = 0;
    const itemsHtml = cart.items.map(it=>{
      const title = it.book? (it.book.title||'') : (it.title||'');
      const author = it.book? (it.book.author||'') : '';
      const price = it.book? (it.book.discountedPrice || it.book.price || 0) : (it.price||0);
      const qty = it.quantity || 1;
      total += price * qty;
      return `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div class="fw-semibold text-dark">${title} <span class="badge bg-secondary ms-1">x${qty}</span></div>
            <div class="small text-muted">${author}</div>
          </div>
          <div class="fw-bold">${currency(price*qty)}</div>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <form id="checkout-form">
        <div class="row g-4">
          <div class="col-lg-7">
            <div class="checkout-card">
              <div class="checkout-header">📍 Thông tin giao hàng</div>
              <div class="mb-4">
                <label class="form-label fw-semibold small text-muted">Địa chỉ nhận hàng <span class="text-danger">*</span></label>
                <input id="ship-address" class="form-control" placeholder="Số nhà, tên ngõ, đường, phường/xã, quận/huyện, tỉnh/thành phố" required>
              </div>
              <div class="checkout-header mt-5">💳 Phương thức thanh toán</div>
              <div class="mb-3">
                <div class="form-check p-3 border rounded-3 mb-3 d-flex align-items-center gap-3">
                  <input class="form-check-input ms-0 mt-0" type="radio" name="payment-method" id="pay-bank" value="bank" checked>
                  <label class="form-check-label flex-grow-1 fw-semibold w-100" for="pay-bank" style="cursor:pointer;">
                    Thanh toán chuyển khoản / Quét mã QR
                    <div class="small text-muted fw-normal">Xác nhận thanh toán tự động và nhanh chóng.</div>
                  </label>
                </div>
                <div class="form-check p-3 border rounded-3 d-flex align-items-center gap-3">
                  <input class="form-check-input ms-0 mt-0" type="radio" name="payment-method" id="pay-cod" value="cod">
                  <label class="form-check-label flex-grow-1 fw-semibold w-100" for="pay-cod" style="cursor:pointer;">
                    Thanh toán khi nhận hàng (COD)
                    <div class="small text-muted fw-normal">Thanh toán bằng tiền mặt khi sách được giao tới bạn.</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="summary-card sticky-top" style="top:2rem;">
              <h5 class="fw-bold mb-4">Tóm tắt đơn hàng</h5>
              <div class="mb-4 pb-4 border-bottom">
                ${itemsHtml}
              </div>
              <div class="d-flex justify-content-between mb-2 text-secondary">
                <span>Tạm tính</span>
                <span class="fw-semibold">${currency(total)}</span>
              </div>
              <div class="d-flex justify-content-between mb-4 text-secondary">
                <span>Phí vận chuyển</span>
                <span class="fw-semibold text-success">Miễn phí</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-4">
                <span class="fw-bold fs-5">Tổng cộng</span>
                <span class="text-danger fw-black fs-3">${currency(total)}</span>
              </div>
              <button type="submit" id="btn-submit" class="btn-pay">XÁC NHẬN ĐẶT HÀNG</button>
            </div>
            <div id="checkout-result" class="mt-4"></div>
          </div>
        </div>
      </form>
    `;

    document.getElementById('checkout-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const address = document.getElementById('ship-address').value.trim();
      const methodRadios = document.getElementsByName('payment-method');
      let method = 'bank';
      for (const rad of methodRadios) {
          if(rad.checked) { method = rad.value; break; }
      }
      
      const btn = document.getElementById('btn-submit');
      btn.disabled = true;
      btn.textContent = 'ĐANG XỬ LÝ...';
      const resultBox = document.getElementById('checkout-result');
      
      try{
        const paymentMethod = method === 'cod' ? 'COD' : 'BANK';
        const resp = await checkoutOrder({ shippingAddress: address, paymentMethod });
        const payload = (resp && resp.data) ? resp.data : resp;

        showToast('Đặt hàng thành công! 🎉');

        // If backend returned a QR code URL (bank transfer flow), show QR + simulate option
        if (payload && payload.qrCodeUrl) {
          resultBox.innerHTML = `
            <div class="qr-box shadow-sm mb-3">
              <h5 class="fw-bold text-primary mb-1">Thanh toán đơn hàng</h5>
              <p class="text-muted small">Quét mã QR dưới đây bằng ứng dụng ngân hàng</p>
              <img src="/uploads/qr-tran-dinh-thuan.jpg" alt="Thanh toán QR" class="img-fluid rounded mb-3" style="max-height: 250px;">
              <div class="bg-light p-2 rounded small fw-semibold">
                Mã đơn: <span class="text-danger">${payload.paymentCode || ''}</span>
              </div>
              <button id="simulate-pay" class="btn btn-outline-success btn-sm w-100 mt-3 fw-bold">(TEST) Kích hoạt giao dịch</button>
            </div>
            <div id="simulate-result"></div>
          `;

          document.getElementById('simulate-pay').addEventListener('click', async ()=>{
            const simBtn = document.getElementById('simulate-pay');
            simBtn.disabled = true;
            simBtn.textContent = 'Đang xử lý...';
            try{
              const orderId = payload._id || payload.id;
              const s = await simulatePayment(orderId);
              const msg = (s && s.message) ? s.message : (s && s.success ? 'Giao dịch thành công!' : 'Không có phản hồi');
              showToast(msg, 'success');
              document.getElementById('simulate-result').innerHTML = `<div class="alert alert-success fs-6 fw-semibold text-center border-0 shadow-sm mt-2">✅ ${msg}</div>`;
              setTimeout(()=> { window.location.href = '/profile.html'; }, 2000);
            }catch(simErr){
              console.error(simErr);
              showToast('Xác nhận thanh toán thất bại', 'error');
              simBtn.disabled = false;
              simBtn.textContent = '(TEST) Thử lại';
            }
          });
        } else {
          resultBox.innerHTML = `
            <div class="alert alert-success border-0 shadow-sm text-center">
              <h5>🎉 Đặt hàng thành công!</h5>
              Mã giao dịch: <strong>${payload.paymentCode || payload.payment_code || ''}</strong><br>
              <small class="text-muted">Chúng tôi sẽ sớm giao hàng cho bạn.</small>
              <div class="mt-3">
                <a href="/profile.html" class="btn btn-success btn-sm px-4 rounded-pill">Kho đơn hàng</a>
              </div>
            </div>`;
        }
      }catch(err){
        console.error(err);
        showToast('Thanh toán thất bại', 'error');
        resultBox.innerHTML = `<div class="alert alert-danger shadow-sm border-0">❌ Lỗi: ${err.message || 'Không thể tạo đơn hàng'}</div>`;
        btn.disabled = false;
        btn.textContent = 'XÁC NHẬN ĐẶT HÀNG';
      }
    });

  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger shadow-sm py-4 text-center">❌ Không thể tải thông tin thanh toán. Vui lòng thử lại.</div>';
  }
}

document.addEventListener('DOMContentLoaded', renderCheckout);
