import { getCategories, createCategory, updateCategory, deleteCategory } from '../api.js';

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

function openModal(category = null) {
  const isEdit = !!category;
  const modalEl = document.getElementById('category-modal');
  const title   = document.getElementById('modal-title');
  const form    = document.getElementById('category-modal-form');

  title.textContent = isEdit ? '✏️ Cập nhật danh mục' : '➕ Tạo danh mục';
  form.dataset.editId = isEdit ? (category._id || category.id) : '';

  document.getElementById('m-name').value = isEdit ? category.name : '';

  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
}

function closeModal() {
  const modalEl = document.getElementById('category-modal');
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
}

async function renderList() {
  const tbody = document.getElementById('category-tbody');
  tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3 text-muted">Đang tải...</td></tr>';

  try {
    const r = await getCategories();
    const list = (r && r.data) ? r.data : (Array.isArray(r) ? r : []);

    tbody.innerHTML = '';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-muted">Chưa có danh mục nào</td></tr>';
      return;
    }

    list.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="fw-semibold">${c.name}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-edit me-1" title="Sửa">✏️</button>
          <button class="btn btn-sm btn-outline-danger btn-del" title="Xóa">🗑️</button>
        </td>
      `;

      tr.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
        try {
          await deleteCategory(c._id || c.id);
          showToast('Xóa thành công!');
          renderList();
        } catch (err) {
          showToast('Xóa thất bại: ' + (err.message || err), 'error');
        }
      });

      tr.querySelector('.btn-edit').addEventListener('click', () => openModal(c));

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger py-3">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('admin-categories-root');
  if (!root) return;

  root.innerHTML = `
    <style>
      #category-modal-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;
        display:none;align-items:center;justify-content:center;
      }
      #category-modal-overlay.show { display:flex; }
      .category-modal-box {
        background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:420px;
        box-shadow:0 24px 60px rgba(0,0,0,.25);animation:zoomIn .25s ease;
      }
      @keyframes zoomIn { from{transform:scale(.92);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes slideInRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
      .table th { background:#f8fafc; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; }
      .header-card {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius:16px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;
        box-shadow:0 8px 30px rgba(16,185,129,.35);
      }
    </style>

    <div>
      <!-- Header -->
      <div class="header-card d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1 fw-bold">📂 Quản lý danh mục</h4>
          <p class="mb-0 opacity-75 small">Tạo, chỉnh sửa và quản lý các danh mục sách</p>
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
                <th>Tên danh mục</th>
                <th class="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody id="category-tbody">
              <tr><td colspan="2" class="text-center py-4 text-muted">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div id="category-modal" id="category-modal-overlay" style="display:none; position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;align-items:center;justify-content:center;">
      <div class="category-modal-box">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 id="modal-title" class="mb-0 fw-bold">➕ Tạo danh mục</h5>
          <button id="btn-close-modal" class="btn-close"></button>
        </div>
        <form id="category-modal-form" novalidate>
          <div class="mb-4">
            <label class="form-label fw-semibold">Tên danh mục <span class="text-danger">*</span></label>
            <input id="m-name" class="form-control" placeholder="VD: Sách Lập Trình" required />
          </div>
          <div id="modal-error" class="alert alert-danger py-2 d-none"></div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" id="btn-cancel-modal" class="btn btn-outline-secondary px-4">Hủy</button>
            <button type="submit" id="btn-submit-modal" class="btn btn-success px-4 fw-semibold">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-open-create').addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('category-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('category-modal')) closeModal();
  });

  document.getElementById('category-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('modal-error');
    errEl.classList.add('d-none');
    errEl.textContent = '';

    const form   = e.target;
    const editId = form.dataset.editId;
    const name   = document.getElementById('m-name').value.trim();

    if (!name) { 
      errEl.textContent = 'Vui lòng nhập tên danh mục'; 
      errEl.classList.remove('d-none'); 
      return; 
    }

    const btn = document.getElementById('btn-submit-modal');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
      if (editId) {
        await updateCategory(editId, { name });
        showToast('Cập nhật danh mục thành công! ✅');
      } else {
        await createCategory({ name });
        showToast('Tạo danh mục thành công! 🎉');
      }
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
