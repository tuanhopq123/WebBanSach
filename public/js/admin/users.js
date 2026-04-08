import { getUsers, updateUser, deleteUser } from '../api.js';

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

function openModal(user = null) {
  if(!user) return; // create user admin side requires a register form which is outside this scope so only edit is allowed right now
  const modalEl = document.getElementById('user-modal');
  const title   = document.getElementById('modal-title');
  const form    = document.getElementById('user-modal-form');

  title.textContent = '✏️ Cập nhật phân quyền người dùng';
  form.dataset.editId = user._id || user.id;

  document.getElementById('m-username').value = user.username || '';
  document.getElementById('m-email').value = user.email || '';
  document.getElementById('m-role').value = (user.role && user.role.name) ? user.role.name : (user.role || 'Customer');

  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
}

function closeModal() {
  const modalEl = document.getElementById('user-modal');
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
}

async function renderList() {
  const tbody = document.getElementById('user-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Đang tải...</td></tr>';

  try {
    const r = await getUsers();
    const list = (r && r.data) ? r.data : (Array.isArray(r) ? r : []);

    tbody.innerHTML = '';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Chưa có người dùng nào</td></tr>';
      return;
    }

    list.forEach(u => {
      const tr = document.createElement('tr');
      const roleName = u.role && u.role.name ? u.role.name : (u.role || 'Customer');
      
      let badgeColor = 'bg-secondary';
      if (roleName === 'Admin') badgeColor = 'bg-danger';
      else if (roleName === 'Staff') badgeColor = 'bg-primary';

      tr.innerHTML = `
        <td><span class="fw-semibold">${u.username}</span></td>
        <td>${u.email}</td>
        <td><span class="badge ${badgeColor}">${roleName}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-edit me-1" title="Phân quyền">✏️</button>
          <button class="btn btn-sm btn-outline-danger btn-del" title="Xóa">🗑️</button>
        </td>
      `;

      tr.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm(`Xóa người dùng "${u.username}"?`)) return;
        try {
          await deleteUser(u._id || u.id);
          showToast('Xóa thành công!');
          renderList();
        } catch (err) {
          showToast('Xóa thất bại: ' + (err.message || err), 'error');
        }
      });

      tr.querySelector('.btn-edit').addEventListener('click', () => openModal(u));

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('admin-users-root');
  if (!root) return;

  root.innerHTML = `
    <style>
      #user-modal-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;
        display:none;align-items:center;justify-content:center;
      }
      #user-modal-overlay.show { display:flex; }
      .user-modal-box {
        background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:420px;
        box-shadow:0 24px 60px rgba(0,0,0,.25);animation:zoomIn .25s ease;
      }
      @keyframes zoomIn { from{transform:scale(.92);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes slideInRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
      .table th { background:#f8fafc; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; }
      .header-card {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius:16px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;
        box-shadow:0 8px 30px rgba(245,158,11,.35);
      }
      .badge { font-size:.75rem; padding:.35em .65em; border-radius:6px; }
    </style>

    <div>
      <!-- Header -->
      <div class="header-card d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1 fw-bold">👥 Quản lý người dùng</h4>
          <p class="mb-0 opacity-75 small">Xem danh sách, phân quyền và quản lý tải khoản</p>
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Phân quyền</th>
                <th class="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody id="user-tbody">
              <tr><td colspan="4" class="text-center py-4 text-muted">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div id="user-modal" id="user-modal-overlay" style="display:none; position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;align-items:center;justify-content:center;">
      <div class="user-modal-box">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 id="modal-title" class="mb-0 fw-bold">✏️ Cập nhật phân quyền</h5>
          <button id="btn-close-modal" class="btn-close"></button>
        </div>
        <form id="user-modal-form" novalidate>
          <div class="mb-3">
            <label class="form-label text-muted">Username</label>
            <input id="m-username" class="form-control" disabled />
          </div>
          <div class="mb-3">
            <label class="form-label text-muted">Email</label>
            <input id="m-email" class="form-control" disabled />
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold">Vai trò <span class="text-danger">*</span></label>
            <select id="m-role" class="form-select" required>
              <option value="Customer">Khách hàng (Customer)</option>
              <option value="Staff">Nhân viên (Staff)</option>
              <option value="Admin">Quản trị viên (Admin)</option>
            </select>
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

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('user-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('user-modal')) closeModal();
  });

  document.getElementById('user-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('modal-error');
    errEl.classList.add('d-none');
    errEl.textContent = '';

    const form   = e.target;
    const editId = form.dataset.editId;
    const role   = document.getElementById('m-role').value;

    const btn = document.getElementById('btn-submit-modal');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
      await updateUser(editId, { role });
      showToast('Cập nhật phân quyền thành công! ✅');
      closeModal();
      renderList();
    } catch (err) {
      errEl.textContent = 'Lỗi: ' + (err.message || 'Đã có lỗi xảy ra');
      errEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Lưu';
    }
  });

  renderList();
});
