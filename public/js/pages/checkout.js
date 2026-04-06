import { getCart, checkoutOrder, simulatePayment } from '../api.js';

console.log('checkout.js loaded');

function currency(n){ return n!=null ? n.toLocaleString() + ' VNĐ' : ''; }

async function renderCheckout(){
  const root = document.getElementById('checkout-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    const res = await getCart();
    const cart = (res && res.data) ? res.data : (Array.isArray(res)? res : (res && res.cart ? res.cart : null));
    if (!cart || !cart.items || cart.items.length===0){
      root.innerHTML = '<div class="alert alert-info">Giỏ hàng trống</div>';
      return;
    }

    let total = 0;
    const itemsHtml = cart.items.map(it=>{
      const price = it.book? (it.book.price||0) : (it.price||0);
      const qty = it.quantity || 1;
      total += price * qty;
      return `<div class="d-flex justify-content-between"><div>${it.book? it.book.title: ''} x ${qty}</div><div>${currency(price*qty)}</div></div>`;
    }).join('');

    root.innerHTML = `
      <div class="card p-3">
        <h5>Đơn hàng</h5>
        <div>${itemsHtml}</div>
        <div class="mt-3 fw-bold">Tổng: ${currency(total)}</div>
      </div>
      <div class="card p-3 mt-3">
        <h5>Thông tin giao hàng</h5>
        <form id="checkout-form">
          <div class="mb-2"><input id="ship-address" class="form-control" placeholder="Địa chỉ giao hàng" required></div>
          <div class="mb-2">
            <select id="payment-method" class="form-select">
              <option value="bank">Thanh toán ngân hàng (QR)</option>
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            </select>
          </div>
          <button class="btn btn-success">Thanh toán</button>
        </form>
      </div>
      <div id="checkout-result" class="mt-3"></div>
    `;

      document.getElementById('checkout-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const address = document.getElementById('ship-address').value.trim();
      const method = document.getElementById('payment-method').value;
      try{
        // Normalize method names expected by backend
        const paymentMethod = method === 'cod' ? 'COD' : 'BANK';
        const resp = await checkoutOrder({ shippingAddress: address, paymentMethod });
        const payload = (resp && resp.data) ? resp.data : resp;

        // If backend returned a QR code URL (bank transfer flow), show QR + simulate option
        if (payload && payload.qrCodeUrl) {
          document.getElementById('checkout-result').innerHTML = `
            <div class="alert alert-success">Đơn hàng đã được tạo. Mã: ${payload.paymentCode || ''}</div>
            <div class="mt-2">Quét mã QR để thanh toán:</div>
            <div class="mt-2"><img src="/uploads/qr-tran-dinh-thuan.jpg" alt="QR" style="max-width:240px;border:1px solid #ddd;padding:6px;background:#fff"/></div>
            <div class="mt-2">
              <button id="simulate-pay" class="btn btn-primary">(TEST) Đã thanh toán - Xác nhận</button>
            </div>
            <div id="simulate-result" class="mt-2"></div>
          `;

          document.getElementById('simulate-pay').addEventListener('click', async ()=>{
            try{
              const orderId = payload._id || payload.id;
              const s = await simulatePayment(orderId);
              const msg = (s && s.message) ? s.message : (s && s.success ? 'OK' : 'Không thành công');
              document.getElementById('simulate-result').innerHTML = `<div class="alert alert-info">${msg}</div>`;
            }catch(simErr){
              console.error(simErr);
              document.getElementById('simulate-result').innerHTML = `<div class="alert alert-danger">Xác nhận thanh toán thất bại</div>`;
            }
          });
        } else {
          document.getElementById('checkout-result').innerHTML = `<div class="alert alert-success">Thanh toán thành công. Mã thanh toán: ${payload.paymentCode || payload.payment_code || ''}</div>`;
        }
      }catch(err){
        console.error(err);
        document.getElementById('checkout-result').innerHTML = `<div class="alert alert-danger">Thanh toán thất bại: ${err.message || 'Lỗi'}</div>`;
      }
    });

  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger">Không thể tải thông tin checkout</div>';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ renderCheckout(); });
