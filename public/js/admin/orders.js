import { getOrderById } from '../api.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('admin-orders-root');
  if (!root) return;

  root.innerHTML = `
    <style>
      .header-card {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius:16px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;
        box-shadow:0 8px 30px rgba(59,130,246,.35);
      }
      .order-result-card {
        background: #fff; border-radius: 16px; padding: 1.5rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      }
      .order-items-table th { background:#f8fafc; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; }
    </style>

    <div>
      <!-- Header -->
      <div class="header-card">
        <h4 class="mb-1 fw-bold">🛒 Quản lý đơn hàng</h4>
        <p class="mb-0 opacity-75 small">Tra cứu và xác nhận thông tin đơn hàng</p>
      </div>

      <!-- Search Section -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-4">
        <h6 class="fw-bold mb-3">Tra cứu đơn hàng bằng ID</h6>
        <div class="input-group">
          <input id="order-id-input" class="form-control form-control-lg" placeholder="Nhập mã đơn hàng (VD: 60d5ec49f1...)" />
          <button id="order-search" class="btn btn-primary px-4 fw-semibold">Tìm kiếm 🔍</button>
        </div>
      </div>

      <!-- Result Section -->
      <div id="order-result"></div>
    </div>
  `;

  document.getElementById('order-search').addEventListener('click', async () => {
    const id = document.getElementById('order-id-input').value.trim();
    const resRoot = document.getElementById('order-result');
    if (!id) return;
    
    resRoot.innerHTML = '<div class="text-center py-4 text-muted">Đang tìm kiếm đơn hàng...</div>';
    
    try {
      const res = await getOrderById(id);
      const payload = (res && res.data) ? res.data : res;
      
      let statusBadge = '';
      const orderStyles = {
        'Pending': 'bg-warning text-dark',
        'Processing': 'bg-info text-dark',
        'Shipped': 'bg-primary',
        'Delivered': 'bg-success',
        'Cancelled': 'bg-danger'
      };
      const badgeClass = orderStyles[payload.status] || 'bg-secondary';
      statusBadge = `<span class="badge ${badgeClass} fs-6 px-3 py-2 rounded-pill">${payload.status}</span>`;

      let itemsHtml = '';
      if (payload.items && payload.items.length > 0) {
        itemsHtml = `
          <div class="table-responsive mt-3 mb-4">
            <table class="table table-hover align-middle order-items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center">Số lượng</th>
                  <th class="text-end">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                ${payload.items.map(item => `
                  <tr>
                    <td>${item.book ? item.book.title : 'Sách không còn tồn tại'} <span class="small text-muted ms-2">(ID: ${item.book ? item.book._id : ''})</span></td>
                    <td class="text-center fw-semibold">${item.quantity}</td>
                    <td class="text-end">${item.priceAtPurchase ? item.priceAtPurchase.toLocaleString('vi-VN') : (item.price || 0).toLocaleString('vi-VN')}₫</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        itemsHtml = '<p class="text-muted mt-2">Không có sản phẩm nào trong đơn hàng này.</p>';
      }

      const totalAmount = payload.totalAmount ? payload.totalAmount.toLocaleString('vi-VN') + '₫' : '0₫';

      resRoot.innerHTML = `
        <div class="order-result-card border border-primary border-opacity-25 shadow">
          <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Chi tiết đơn hàng</h5>
            <div class="d-flex align-items-center gap-2">
                ${statusBadge}
                <div class="input-group ms-3" style="width: 250px;">
                    <select id="status-select" class="form-select form-select-sm fw-semibold">
                        <option value="Pending" ${payload.status === 'Pending' ? 'selected' : ''}>Pending (Chờ xử lý)</option>
                        <option value="Processing" ${payload.status === 'Processing' ? 'selected' : ''}>Processing (Đang xử lý)</option>
                        <option value="Shipped" ${payload.status === 'Shipped' ? 'selected' : ''}>Shipped (Đang giao)</option>
                        <option value="Delivered" ${payload.status === 'Delivered' ? 'selected' : ''}>Delivered (Thành công)</option>
                        <option value="Cancelled" ${payload.status === 'Cancelled' ? 'selected' : ''}>Cancelled (Đã hủy)</option>
                    </select>
                    <button id="btn-update-status" class="btn btn-sm btn-primary">Cập nhật</button>
                </div>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Mã đơn hàng:</span><br/>
              <strong class="fs-6">${payload._id || payload.id}</strong>
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Ngày đặt:</span><br/>
              <strong class="fs-6">${fmtDate(payload.createdAt)}</strong>
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Khách hàng:</span><br/>
              <strong class="fs-6">${payload.user ? payload.user.username : 'Unknown'} <span class="text-muted fw-normal">(${payload.user ? payload.user.email : ''})</span></strong>
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Địa chỉ giao hàng:</span><br/>
              <strong class="fs-6 text-dark">${payload.shippingAddress || '—'}</strong>
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Phương thức thanh toán:</span><br/>
              <strong class="fs-6">${payload.paymentMethod || '—'}</strong>
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Mã tra cứu thanh toán:</span><br/>
              <strong class="fs-6 text-danger">${payload.paymentCode || '—'}</strong>
            </div>
          </div>
          
          <h6 class="fw-bold pb-2 text-dark">📦 Danh sách sản phẩm</h6>
          ${itemsHtml}
          
          <div class="text-end mt-4 p-3 bg-light rounded-3">
            <h5 class="fw-bold mb-0">Tổng giá trị: <span class="text-danger fs-3 ms-2">${totalAmount}</span></h5>
          </div>
        </div>
      `;

      // Assign event listener
      document.getElementById('btn-update-status').addEventListener('click', async () => {
          const newStatus = document.getElementById('status-select').value;
          const btn = document.getElementById('btn-update-status');
          btn.disabled = true;
          btn.textContent = '...';
          try {
             const apiUpdate = await import('../api.js');
             await apiUpdate.updateOrderStatus(payload._id || payload.id, newStatus);
             alert('Cập nhật trạng thái thành công!');
             // re-fetch automatically
             document.getElementById('order-search').click();
          } catch(err) {
             console.error(err);
             alert('Cập nhật thất bại: ' + (err.message || ''));
             btn.disabled = false;
             btn.textContent = 'Cập nhật';
          }
      });

    } catch (err) {
      console.error(err);
      resRoot.innerHTML = `
        <div class="alert alert-danger shadow-sm rounded-3">
          ❌ Không tìm thấy đơn hàng hoặc bạn không có quyền xem thông tin này.
        </div>
      `;
    }
  });
});
