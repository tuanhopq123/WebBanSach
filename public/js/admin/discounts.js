import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../api.js';

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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

// ─── Modal ─────────────────────────────────────────────────────────────────
function openModal(discount = null) {
  const isEdit = !!discount;
  const modalEl = document.getElementById('discount-modal');
  const title   = document.getElementById('modal-title');
  const form    = document.getElementById('discount-modal-form');

  title.textContent = isEdit ? '✏️ Cập nhật mã giảm giá' : '➕ Tạo mã giảm giá';
  form.dataset.editId = isEdit ? (discount._id || discount.id) : '';

  document.getElementById('m-code').value    = isEdit ? discount.code : '';
  document.getElementById('m-code').disabled = isEdit; // không cho đổi code khi edit
  document.getElementById('m-percent').value = isEdit ? (discount.discountPercentage || 0) : '';
  document.getElementById('m-amount').value  = isEdit ? (discount.discountAmount || 0) : '';
  document.getElementById('m-from').value    = isEdit && discount.validFrom
    ? new Date(discount.validFrom).toISOString().slice(0, 10) : todayISO();
  document.getElementById('m-until').value   = isEdit && discount.validUntil
    ? new Date(discount.validUntil).toISOString().slice(0, 10) : '';
  document.getElementById('m-active').checked = isEdit ? discount.isActive : true;

  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
}

function closeModal() {
  const modalEl = document.getElementById('discount-modal');
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
}

// ─── Render list ───────────────────────────────────────────────────────────
async function renderList() {
  const tbody = document.getElementById('discount-tbody');
  const emptyRow = document.getElementById('empty-row');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Đang tải...</td></tr>';

  try {
    const r = await getDiscounts();
    const list = (r && r.data) ? r.data : (Array.isArray(r) ? r : []);

    tbody.innerHTML = '';

    if (!list.length) {
      tbody.innerHTML = '<tr id="empty-row"><td colspan="7" class="text-center py-4 text-muted">Chưa có mã giảm giá nào</td></tr>';
      return;
    }

    list.forEach(d => {
      const isActive = d.isActive;
      const now = new Date();
      const expired = new Date(d.validUntil) < now;

      let statusBadge;
      if (!isActive) {
        statusBadge = '<span class="badge bg-secondary">Tắt</span>';
      } else if (expired) {
        statusBadge = '<span class="badge bg-warning text-dark">Hết hạn</span>';
      } else {
        statusBadge = '<span class="badge bg-success">Hoạt động</span>';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code class="fw-bold text-primary">${d.code}</code></td>
        <td>${d.discountPercentage ? d.discountPercentage + '%' : '—'}</td>
        <td>${d.discountAmount ? d.discountAmount.toLocaleString('vi-VN') + '₫' : '—'}</td>
        <td>${fmtDate(d.validFrom)}</td>
        <td>${fmtDate(d.validUntil)}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-edit me-1" title="Sửa">✏️</button>
          <button class="btn btn-sm btn-outline-danger btn-del" title="Xóa">🗑️</button>
        </td>
      `;

      tr.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm(`Xóa mã "${d.code}"?`)) return;
        try {
          await deleteDiscount(d._id || d.id);
          showToast('Xóa thành công!');
          renderList();
        } catch (err) {
          showToast('Xóa thất bại: ' + (err.message || err), 'error');
        }
      });

      tr.querySelector('.btn-edit').addEventListener('click', () => openModal(d));

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('admin-discounts-root');
  if (!root) return;

  root.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      #discounts-section { font-family: 'Inter', sans-serif; }
      #discount-modal-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;
        display:none;align-items:center;justify-content:center;
      }
      #discount-modal-overlay.show { display:flex; }
      .discount-modal-box {
        background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:520px;
        box-shadow:0 24px 60px rgba(0,0,0,.25);animation:zoomIn .25s ease;
      }
      @keyframes zoomIn { from{transform:scale(.92);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes slideInRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
      .table th { background:#f8fafc; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; }
      .badge { font-size:.75rem; padding:.35em .65em; border-radius:6px; }
      .discount-header-card {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius:16px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;
        box-shadow:0 8px 30px rgba(99,102,241,.35);
      }
    </style>

    <div id="discounts-section">
      <!-- Header -->
      <div class="discount-header-card d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1 fw-bold">🏷️ Quản lý mã giảm giá</h4>
          <p class="mb-0 opacity-75 small">Tạo, chỉnh sửa và theo dõi các mã discount</p>
        </div>
        <button id="btn-open-create" class="btn btn-light fw-semibold px-4">
          + Tạo mới
        </button>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Mã</th>
                <th>% Giảm</th>
                <th>Số tiền giảm</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody id="discount-tbody">
              <tr><td colspan="7" class="text-center py-4 text-muted">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div id="discount-modal" class="discount-modal-overlay">
      <div class="discount-modal-box">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 id="modal-title" class="mb-0 fw-bold">➕ Tạo mã giảm giá</h5>
          <button id="btn-close-modal" class="btn-close"></button>
        </div>
        <form id="discount-modal-form" novalidate>
          <div class="mb-3">
            <label class="form-label fw-semibold">Mã giảm giá <span class="text-danger">*</span></label>
            <input id="m-code" class="form-control" placeholder="VD: SALE20" required />
            <div class="form-text">Mã sẽ được tự động viết hoa</div>
          </div>
          <div class="row g-3 mb-3">
            <div class="col-6">
              <label class="form-label fw-semibold">% Giảm</label>
              <input id="m-percent" class="form-control" type="number" min="0" max="100" placeholder="0" />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">Số tiền giảm (₫)</label>
              <input id="m-amount" class="form-control" type="number" min="0" placeholder="0" />
            </div>
          </div>
          <p class="text-muted small mb-3">⚠️ Phải nhập ít nhất một trong hai: % giảm hoặc số tiền giảm (lớn hơn 0)</p>
          <div class="row g-3 mb-3">
            <div class="col-6">
              <label class="form-label fw-semibold">Từ ngày <span class="text-danger">*</span></label>
              <input id="m-from" class="form-control" type="date" required />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">Đến ngày <span class="text-danger">*</span></label>
              <input id="m-until" class="form-control" type="date" required />
            </div>
          </div>
          <div class="form-check mb-4">
            <input id="m-active" class="form-check-input" type="checkbox" checked />
            <label class="form-check-label fw-semibold" for="m-active">Kích hoạt ngay</label>
          </div>
          <div id="modal-error" class="alert alert-danger py-2 d-none"></div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" id="btn-cancel-modal" class="btn btn-outline-secondary px-4">Hủy</button>
            <button type="submit" id="btn-submit-modal" class="btn btn-primary px-4 fw-semibold">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Bind open/close modal
  document.getElementById('btn-open-create').addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('discount-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('discount-modal')) closeModal();
  });

  // Form submit
  document.getElementById('discount-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('modal-error');
    errEl.classList.add('d-none');
    errEl.textContent = '';

    const form      = e.target;
    const editId    = form.dataset.editId;
    const code      = document.getElementById('m-code').value.trim();
    const percent   = parseFloat(document.getElementById('m-percent').value) || 0;
    const amount    = parseFloat(document.getElementById('m-amount').value) || 0;
    const validFrom = document.getElementById('m-from').value;
    const validUntil= document.getElementById('m-until').value;
    const isActive  = document.getElementById('m-active').checked;

    // Client-side validation
    if (!code) { showErr('Vui lòng nhập mã giảm giá'); return; }
    if (percent === 0 && amount === 0) { showErr('Phải nhập % giảm hoặc số tiền giảm lớn hơn 0'); return; }
    if (!validFrom) { showErr('Vui lòng chọn ngày bắt đầu'); return; }
    if (!validUntil) { showErr('Vui lòng chọn ngày kết thúc'); return; }
    if (new Date(validUntil) <= new Date(validFrom)) { showErr('Ngày kết thúc phải sau ngày bắt đầu'); return; }

    function showErr(msg) { errEl.textContent = msg; errEl.classList.remove('d-none'); }

    const payload = {
      code,
      discountPercentage: percent,
      discountAmount: amount,
      validFrom,
      validUntil,
      isActive
    };

    const btn = document.getElementById('btn-submit-modal');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
      if (editId) {
        delete payload.code; // không update code
        await updateDiscount(editId, payload);
        showToast('Cập nhật thành công! ✅');
      } else {
        await createDiscount(payload);
        showToast('Tạo mã giảm giá thành công! 🎉');
      }
      closeModal();
      renderList();
    } catch (err) {
      const msg = err.message || 'Đã có lỗi xảy ra';
      showErr('Lỗi: ' + msg);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Lưu';
    }
  });

  renderList();
});
