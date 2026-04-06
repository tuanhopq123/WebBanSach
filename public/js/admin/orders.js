import { getOrderById } from '../api.js';

document.addEventListener('DOMContentLoaded', ()=>{
  const root = document.getElementById('admin-orders-root');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3">
      <div class="input-group">
        <input id="order-id-input" class="form-control" placeholder="Nhập Order ID" />
        <button id="order-search" class="btn btn-primary">Tìm</button>
      </div>
    </div>
    <div id="order-result"></div>
  `;

  document.getElementById('order-search').addEventListener('click', async ()=>{
    const id = document.getElementById('order-id-input').value.trim();
    const resRoot = document.getElementById('order-result');
    if (!id) return;
    resRoot.innerHTML = 'Đang tải...';
    try{
      const res = await getOrderById(id);
      const payload = (res && res.data) ? res.data : res;
      resRoot.innerHTML = `<pre>${JSON.stringify(payload, null, 2)}</pre>`;
    }catch(err){ console.error(err); resRoot.innerHTML = `<div class="alert alert-danger">Không tìm thấy đơn hàng</div>`; }
  });
});
