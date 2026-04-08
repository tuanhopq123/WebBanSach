import { getOrderById, apiGet, updateOrderStatus } from '../api.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusClass(status) {
  const map = { 'Pending': 'bg-warning text-dark', 'Processing': 'bg-info text-dark', 'Shipped': 'bg-primary', 'Delivered': 'bg-success', 'Cancelled': 'bg-danger' };
  return map[status] || 'bg-secondary';
}

async function renderOrderList() {
  const listRoot = document.getElementById('order-list-tbody');
  if (!listRoot) return;
  listRoot.innerHTML = '<tr><td colspan="4" class="text-center py-4">Đang tải danh sách...</td></tr>';

  try {
    const res = await apiGet('/api/orders');
    const orders = res.data || [];

    if (orders.length === 0) {
      listRoot.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Chưa có đơn hàng nào.</td></tr>';
      return;
    }

    listRoot.innerHTML = orders.map(ord => `
            <tr style="cursor:pointer; transition: background 0.2s;" class="hover-bg-light" onclick="document.getElementById('order-id-input').value='${ord._id}'; document.getElementById('order-search').click();">
                <td><small class="text-muted fw-bold">#${ord._id.slice(-5)}</small></td>
                <td><span class="fw-semibold text-dark">${ord.user?.username || 'Khách'}</span></td>
                <td><strong class="text-danger">${ord.totalAmount.toLocaleString()}₫</strong></td>
                <td><span class="badge ${getStatusClass(ord.status)}">${ord.status}</span></td>
            </tr>
        `).join('');
  } catch (e) {
    listRoot.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-4">Lỗi tải danh sách. Vui lòng kiểm tra Backend.</td></tr>';
  }
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
      .hover-bg-light:hover { background-color: #f1f5f9 !important; }
    </style>

    <div>
      <div class="header-card">
        <h4 class="mb-1 fw-bold">🛒 Quản lý đơn hàng</h4>
        <p class="mb-0 opacity-75 small">Tra cứu và xác nhận thông tin đơn hàng</p>
      </div>

      <div class="row g-4">
        <div class="col-lg-5">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h6 class="fw-bold mb-3">Tra cứu bằng ID</h6>
                <div class="input-group mb-4">
                  <input id="order-id-input" class="form-control" placeholder="Mã đơn hàng..." />
                  <button id="order-search" class="btn btn-primary px-3">Tìm kiếm 🔍</button>
                </div>
                
                <h6 class="fw-bold mb-3 pb-2 border-bottom">Đơn hàng mới nhất</h6>
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table class="table table-sm align-middle">
                        <tbody id="order-list-tbody"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-lg-7">
            <div id="order-result" class="h-100">
                <div class="card border-0 shadow-sm rounded-4 p-5 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                    <h1 class="display-4 mb-3">📦</h1>
                    <h5>Chưa chọn đơn hàng</h5>
                    <p>Hãy chọn một đơn hàng từ danh sách bên trái để xem chi tiết.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  `;

  renderOrderList();

  document.getElementById('order-search').addEventListener('click', async () => {
    const id = document.getElementById('order-id-input').value.trim();
    const resRoot = document.getElementById('order-result');
    if (!id) return;

    resRoot.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 h-100 d-flex align-items-center justify-content-center text-muted">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        Đang tải chi tiết đơn hàng...
      </div>
    `;

    try {
      const res = await getOrderById(id);
      const payload = (res && res.data) ? res.data : res;

      const badgeClass = getStatusClass(payload.status);
      const statusBadge = `<span class="badge ${badgeClass} fs-6 px-3 py-2 rounded-pill">${payload.status}</span>`;

      // Xác định trạng thái thanh toán (Dựa vào isPaid)
      const isPaidBadge = payload.isPaid
        ? `<span class="badge bg-success ms-2 px-2 py-1"><i class="bi bi-check-circle"></i> Đã thanh toán</span>`
        : `<span class="badge bg-danger ms-2 px-2 py-1"><i class="bi bi-x-circle"></i> Chưa thanh toán</span>`;

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
                    <td>${item.book ? item.book.title : 'Sách bị xóa'} <span class="small text-muted ms-2">(ID: ${item.book ? item.book._id : ''})</span></td>
                    <td class="text-center fw-semibold">${item.quantity}</td>
                    <td class="text-end">${item.priceAtPurchase ? item.priceAtPurchase.toLocaleString('vi-VN') : (item.price || 0).toLocaleString('vi-VN')}₫</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        itemsHtml = '<p class="text-muted mt-2">Không có sản phẩm.</p>';
      }

      const totalAmount = payload.totalAmount ? payload.totalAmount.toLocaleString('vi-VN') + '₫' : '0₫';

      // LOGIC XÂY DỰNG STATE MACHINE CHUẨN QUỐC TẾ
      let selectOptions = '';
      let selectDisabled = false;
      const curStatus = payload.status;

      if (curStatus === 'Delivered') {
        selectOptions = `<option value="Delivered" selected>Delivered (Đã hoàn thành)</option>`;
        selectDisabled = true; // Khóa mồm
      } else if (curStatus === 'Cancelled') {
        selectOptions = `<option value="Cancelled" selected>Cancelled (Đã hủy)</option>`;
        selectDisabled = true; // Khóa mồm
      } else if (curStatus === 'Pending') {
        selectOptions = `
            <option value="Pending" selected>Pending (Chờ xử lý)</option>
            <option value="Processing">Processing (Chuẩn bị hàng)</option>
            <option value="Cancelled">Cancelled (Hủy đơn)</option>
          `;
      } else if (curStatus === 'Processing') {
        selectOptions = `
            <option value="Processing" selected>Processing (Chuẩn bị hàng)</option>
            <option value="Shipped">Shipped (Đang giao hàng)</option>
            <option value="Cancelled">Cancelled (Hủy đơn)</option>
          `;
      } else if (curStatus === 'Shipped') {
        selectOptions = `
            <option value="Shipped" selected>Shipped (Đang giao hàng)</option>
            <option value="Delivered">Delivered (Giao thành công)</option>
          `;
      }

      resRoot.innerHTML = `
        <div class="order-result-card border border-primary border-opacity-25 shadow-sm h-100">
          <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Chi tiết đơn hàng</h5>
            <div class="d-flex align-items-center gap-2">
                ${statusBadge}
            </div>
          </div>

          <div class="bg-light rounded-3 p-3 mb-4 d-flex justify-content-between align-items-center border">
              <span class="fw-semibold text-dark">Cập nhật trạng thái:</span>
              <div class="input-group" style="width: 300px;">
                  <select id="status-select" class="form-select fw-semibold" ${selectDisabled ? 'disabled' : ''}>
                      ${selectOptions}
                  </select>
                  <button id="btn-update-status" class="btn btn-primary fw-bold" ${selectDisabled ? 'disabled' : ''}>Lưu</button>
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
              <span class="text-muted small">Thanh toán:</span><br/>
              <strong class="fs-6">${payload.paymentMethod || '—'}</strong> ${isPaidBadge}
            </div>
            <div class="col-md-6 mb-3">
              <span class="text-muted small">Mã Code:</span><br/>
              <strong class="fs-6 text-danger">${payload.paymentCode || '—'}</strong>
            </div>
          </div>
          
          <h6 class="fw-bold pb-2 text-dark">📦 Danh sách sản phẩm</h6>
          ${itemsHtml}
          
          <div class="text-end mt-4 p-3 bg-light rounded-3 border">
            <h5 class="fw-bold mb-0">Tổng giá trị: <span class="text-danger fs-3 ms-2">${totalAmount}</span></h5>
          </div>
        </div>
      `;

      if (!selectDisabled) {
        document.getElementById('btn-update-status').addEventListener('click', async () => {
          const newStatus = document.getElementById('status-select').value;
          const btn = document.getElementById('btn-update-status');
          btn.disabled = true;
          btn.textContent = '...';
          try {
            await updateOrderStatus(payload._id || payload.id, newStatus);
            alert('Cập nhật trạng thái thành công!');
            document.getElementById('order-search').click();
            renderOrderList();
          } catch (err) {
            console.error(err);
            alert('Cập nhật thất bại: ' + (err.message || ''));
            btn.disabled = false;
            btn.textContent = 'Lưu';
          }
        });
      }

    } catch (err) {
      console.error(err);
      resRoot.innerHTML = `
        <div class="alert alert-danger shadow-sm rounded-4 p-4 text-center">
          <h5>❌ Lỗi truy xuất dữ liệu</h5>
          <p class="mb-0">Không tìm thấy đơn hàng hoặc bạn không có quyền xem thông tin này.</p>
        </div>
      `;
    }
  });
});