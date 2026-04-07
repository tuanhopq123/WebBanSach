import { apiGet, getMyOrders } from '../api.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  const root = document.getElementById('profile-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    const res = await apiGet('/api/users/profile');
    const user = (res && res.data) ? res.data : null;
    if (!user) { root.innerHTML = '<div class="alert alert-info">Chưa đăng nhập</div>'; return; }
    root.innerHTML = `
      <div class="card p-3">
        <h5>${user.username || user.email}</h5>
        <div>Email: ${user.email}</div>
        <div>Role: ${(typeof user.role === 'object' && user.role !== null) ? (user.role.name || '') : (user.role || '')}</div>
        <div class="mt-3"><a href="/" class="btn btn-secondary btn-sm">Về trang chủ</a> <a href="/cart.html" class="btn btn-primary btn-sm">Giỏ hàng</a></div>
      </div>
    `;
  }catch(err){ console.error(err); root.innerHTML = '<div class="alert alert-danger">Không tải được hồ sơ</div>'; }
});
