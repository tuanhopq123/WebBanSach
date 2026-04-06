// Cart page logic
import { getCart, updateCartItem, clearCart } from '../api.js';

console.log('cart.js loaded');

function currency(n){ return n!=null ? n.toLocaleString() + ' VNĐ' : ''; }

async function renderCart(){
  const root = document.getElementById('cart-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    const res = await getCart();
    // res may be { success:true, data: cart } or an array
    const cart = (res && res.data) ? res.data : (Array.isArray(res)? res : (res && res.cart ? res.cart : null));
    if (!cart || !cart.items || cart.items.length===0){
      root.innerHTML = '<div class="alert alert-info">Giỏ hàng trống</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `<thead><tr><th>Sách</th><th>Giá</th><th>Số lượng</th><th>Tổng</th></tr></thead>`;
    const tb = document.createElement('tbody');
    let grand = 0;
    cart.items.forEach(item=>{
      const tr = document.createElement('tr');
      const title = item.book? (item.book.title || '') : (item.title||'');
      const price = item.book? (item.book.price || 0) : (item.price||0);
      const qty = item.quantity || 1;
      const line = price * qty;
      grand += line;

      tr.innerHTML = `
        <td>${title}</td>
        <td>${currency(price)}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary btn-decr">-</button>
            <input class="form-control form-control-sm qty-input" style="width:60px;" value="${qty}" />
            <button class="btn btn-sm btn-outline-secondary btn-incr">+</button>
          </div>
        </td>
        <td>${currency(line)}</td>
      `;

      // wire events
      const decr = tr.querySelector('.btn-decr');
      const incr = tr.querySelector('.btn-incr');
      const qtyInput = tr.querySelector('.qty-input');
      decr.addEventListener('click', async ()=>{ const v = Math.max(1, Number(qtyInput.value||1)-1); qtyInput.value = v; await saveQty(item.book?item.book._id:item.bookId, v); renderCart(); });
      incr.addEventListener('click', async ()=>{ const v = Math.max(1, Number(qtyInput.value||1)+1); qtyInput.value = v; await saveQty(item.book?item.book._id:item.bookId, v); renderCart(); });
      qtyInput.addEventListener('change', async ()=>{ const v = Math.max(1, Number(qtyInput.value||1)); qtyInput.value = v; await saveQty(item.book?item.book._id:item.bookId, v); renderCart(); });

      tb.appendChild(tr);
    });
    table.appendChild(tb);

    const footer = document.createElement('div');
    footer.className = 'mt-3 d-flex justify-content-between align-items-center';
    footer.innerHTML = `<div><button id="clear-cart" class="btn btn-sm btn-outline-danger">Xóa giỏ hàng</button></div><div class="fw-bold">Tổng: ${currency(grand)}</div>`;

    root.innerHTML = '';
    root.appendChild(table);
    root.appendChild(footer);

    document.getElementById('clear-cart').addEventListener('click', async ()=>{ if(!confirm('Xóa toàn bộ giỏ hàng?')) return; await clearCart(); renderCart(); });

    const checkoutBtn = document.createElement('a');
    checkoutBtn.href = '/checkout.html';
    checkoutBtn.className = 'btn btn-primary mt-3';
    checkoutBtn.textContent = 'Thanh toán';
    root.appendChild(checkoutBtn);

  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger">Không thể tải giỏ hàng</div>';
  }
}

async function saveQty(bookId, qty){
  try{
    await updateCartItem({ bookId, quantity: qty });
  }catch(err){ console.warn('Không lưu được số lượng', err); }
}

document.addEventListener('DOMContentLoaded', ()=>{ renderCart(); });
