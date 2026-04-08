import { getBooks, getCategories, createBook, updateBook, deleteBook, uploadImageForBook } from '../api.js';

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

let allCategories = [];

function openModal(book = null) {
  const isEdit = !!book;
  const modalEl = document.getElementById('book-modal');
  const title   = document.getElementById('modal-title');
  const form    = document.getElementById('book-modal-form');
  
  // Populate categories select
  const catSel = document.getElementById('m-category');
  catSel.innerHTML = '<option value="">Chọn danh mục</option>';
  allCategories.forEach(c => { 
    const o = document.createElement('option'); 
    o.value = c._id || c.id; 
    o.textContent = c.name; 
    catSel.appendChild(o); 
  });

  title.textContent = isEdit ? '✏️ Cập nhật sách' : '➕ Thêm sách mới';
  form.dataset.editId = isEdit ? (book._id || book.id) : '';

  document.getElementById('m-title').value = isEdit ? (book.title || '') : '';
  document.getElementById('m-author').value = isEdit ? (book.author || '') : '';
  document.getElementById('m-price').value = isEdit ? (book.price || 0) : '';
  document.getElementById('m-stock').value = isEdit ? (book.stockQuantity || 0) : '0';
  document.getElementById('m-category').value = isEdit && book.category ? (book.category._id || book.category.id || book.category) : '';
  document.getElementById('m-desc').value = isEdit ? (book.description || '') : '';
  document.getElementById('m-image').value = '';

  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
}

function closeModal() {
  const modalEl = document.getElementById('book-modal');
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
}

async function renderList() {
  const tbody = document.getElementById('book-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Đang tải...</td></tr>';

  try {
    const [catsResp, booksResp] = await Promise.all([getCategories(), getBooks({ page:1, limit:100 })]);
    allCategories = (catsResp && catsResp.data) ? catsResp.data : (Array.isArray(catsResp) ? catsResp : []);
    const list = (booksResp && booksResp.data) ? booksResp.data : (Array.isArray(booksResp) ? booksResp : []);

    tbody.innerHTML = '';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có sách nào</td></tr>';
      return;
    }

    list.forEach(b => {
      const tr = document.createElement('tr');
      const imgUrl = (b.images && b.images[0]) ? (b.images[0].startsWith('/')? b.images[0] : '/uploads/'+b.images[0]) : '/uploads/image-1775355300478-674669297.jpg';
      const catName = b.category ? b.category.name : '<span class="text-muted">Không có</span>';
      const stockBadge = (b.stockQuantity > 0) 
        ? `<span class="badge bg-success">${b.stockQuantity}</span>` 
        : `<span class="badge bg-danger">Hết hàng</span>`;

      tr.innerHTML = `
        <td style="width:64px;"><img src="${imgUrl}" class="rounded shadow-sm" style="width:48px;height:56px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/48x56?text=No+Img'"/></td>
        <td>
          <div class="fw-semibold text-truncate" style="max-width:200px;" title="${b.title}">${b.title}</div>
          <div class="small text-muted">${b.author}</div>
        </td>
        <td><span class="fw-bold text-danger">${b.price.toLocaleString('vi-VN')}₫</span></td>
        <td>${catName}</td>
        <td class="text-center">${stockBadge}</td>
        <td class="text-end">
          <label class="btn btn-sm btn-outline-success me-1 mb-0" title="Đổi ảnh">
            📷 <input type="file" class="upload-pic-input border-0 d-none" accept="image/*" />
          </label>
          <button class="btn btn-sm btn-outline-primary btn-edit me-1" title="Sửa">✏️</button>
          <button class="btn btn-sm btn-outline-danger btn-del" title="Xóa">🗑️</button>
        </td>
      `;

      tr.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm(`Xóa sách "${b.title}"?`)) return;
        try {
          await deleteBook(b._id || b.id);
          showToast('Xóa thành công!');
          renderList();
        } catch (err) {
          showToast('Xóa thất bại: ' + (err.message || err), 'error');
        }
      });

      tr.querySelector('.btn-edit').addEventListener('click', () => openModal(b));
      
      tr.querySelector('.upload-pic-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        try {
          const fd = new FormData(); fd.append('image', file);
          await uploadImageForBook(b._id || b.id, fd);
          showToast('Tải ảnh lên thành công!');
          renderList();
        } catch (err) {
          showToast('Tải ảnh thất bại: ' + (err.message || err), 'error');
        }
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('admin-books-root');
  if (!root) return;

  root.innerHTML = `
    <style>
      #book-modal-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;
        display:none;align-items:center;justify-content:center;
      }
      #book-modal-overlay.show { display:flex; }
      .book-modal-box {
        background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:600px;
        box-shadow:0 24px 60px rgba(0,0,0,.25);animation:zoomIn .25s ease;
      }
      @keyframes zoomIn { from{transform:scale(.92);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes slideInRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
      .table th { background:#f8fafc; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; }
      .header-card {
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
        border-radius:16px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;
        box-shadow:0 8px 30px rgba(236,72,153,.35);
      }
      .badge { font-size:.70rem; padding:.35em .60em; border-radius:6px; }
    </style>

    <div>
      <!-- Header -->
      <div class="header-card d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1 fw-bold">📖 Quản lý kho sách</h4>
          <p class="mb-0 opacity-75 small">Xem danh sách, thêm, sửa, xóa thông tin sách lưu trữ</p>
        </div>
        <button id="btn-open-create" class="btn btn-light fw-semibold px-4">
          + Thêm mới
        </button>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Sách & Tác giả</th>
                <th>Giá bán</th>
                <th>Danh mục</th>
                <th class="text-center">Tồn kho</th>
                <th class="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody id="book-tbody">
              <tr><td colspan="6" class="text-center py-4 text-muted">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div id="book-modal" id="book-modal-overlay" style="display:none; position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1050;align-items:center;justify-content:center;">
      <div class="book-modal-box">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 id="modal-title" class="mb-0 fw-bold">➕ Thêm sách mới</h5>
          <button type="button" id="btn-close-modal" class="btn-close"></button>
        </div>
        <form id="book-modal-form" novalidate>
          <div class="row g-3 mb-3">
            <div class="col-sm-7">
              <label class="form-label fw-semibold">Tên sách <span class="text-danger">*</span></label>
              <input id="m-title" class="form-control" placeholder="Tên sách" required />
            </div>
            <div class="col-sm-5">
              <label class="form-label fw-semibold">Tác giả <span class="text-danger">*</span></label>
              <input id="m-author" class="form-control" placeholder="Tác giả" required />
            </div>
          </div>
          <div class="row g-3 mb-3">
            <div class="col-sm-4">
              <label class="form-label fw-semibold">Giá bán (₫) <span class="text-danger">*</span></label>
              <input id="m-price" type="number" min="0" class="form-control" placeholder="0" required />
            </div>
            <div class="col-sm-3">
              <label class="form-label fw-semibold">Kho <span class="text-danger">*</span></label>
              <input id="m-stock" type="number" min="0" class="form-control" value="0" required />
            </div>
            <div class="col-sm-5">
              <label class="form-label fw-semibold">Danh mục</label>
              <select id="m-category" class="form-select"></select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Ảnh bìa</label>
            <input id="m-image" type="file" class="form-control" accept="image/*" />
            <small class="text-muted">Để trống nếu không muốn đổi ảnh.</small>
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold">Mô tả chi tiết</label>
            <textarea id="m-desc" class="form-control" rows="3" placeholder="Mô tả tóm tắt..."></textarea>
          </div>
          <div id="modal-error" class="alert alert-danger py-2 d-none"></div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" id="btn-cancel-modal" class="btn btn-outline-secondary px-4">Hủy</button>
            <button type="submit" id="btn-submit-modal" class="btn btn-primary px-4 fw-semibold">Lưu sách</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-open-create').addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('book-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('book-modal')) closeModal();
  });

  document.getElementById('book-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('modal-error');
    errEl.classList.add('d-none');
    errEl.textContent = '';

    const form   = e.target;
    const editId = form.dataset.editId;
    
    const title = document.getElementById('m-title').value.trim();
    const author = document.getElementById('m-author').value.trim();
    const price = Number(document.getElementById('m-price').value || 0);
    const stockQuantity = Number(document.getElementById('m-stock').value || 0);
    const category = document.getElementById('m-category').value;
    const description = document.getElementById('m-desc').value.trim();
    const imageFile = document.getElementById('m-image').files[0];

    if (!title || !author) { 
      errEl.textContent = 'Vui lòng điền đủ Tên sách và Tác giả'; 
      errEl.classList.remove('d-none'); 
      return; 
    }

    const payload = { title, author, price, stockQuantity, category, description };

    const btn = document.getElementById('btn-submit-modal');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
      let bookId;
      if (editId) {
        await updateBook(editId, payload);
        bookId = editId;
        showToast('Cập nhật sách thành công! ✅');
      } else {
        const res = await createBook(payload);
        bookId = (res && res.data) ? (res.data._id || res.data.id) : (res._id || res.id);
        showToast('Tạo sách mới thành công! 🎉');
      }

      if (imageFile && bookId) {
        const fd = new FormData(); 
        fd.append('image', imageFile);
        await uploadImageForBook(bookId, fd);
        showToast('Tải ảnh bìa thành công!');
      }

      closeModal();
      renderList();
    } catch (err) {
      errEl.textContent = 'Lỗi: ' + (err.message || 'Đã có lỗi xảy ra');
      errEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Lưu sách';
    }
  });

  renderList();
});
