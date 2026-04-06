import { getBooks, getCategories, createBook, updateBook, deleteBook, uploadImageForBook } from '../api.js';

console.log('admin books module loaded');

async function renderAdminBooks(){
  const root = document.getElementById('admin-books-root');
  if (!root) return;
  root.innerHTML = '<div>Đang tải sách...</div>';

  try{
    const [catsResp, booksResp] = await Promise.all([getCategories(), getBooks({ page:1, limit:50 })]);
    const cats = (catsResp && catsResp.data) ? catsResp.data : (Array.isArray(catsResp)? catsResp: []);
    const books = (booksResp && booksResp.data) ? booksResp.data : (Array.isArray(booksResp)? booksResp : []);

    root.innerHTML = `
      <div class="mb-3">
        <h5>Tạo sách mới</h5>
        <form id="create-book-form" class="row g-2">
          <div class="col-md-6"><input class="form-control" id="b-title" placeholder="Tiêu đề" required></div>
          <div class="col-md-6"><input class="form-control" id="b-author" placeholder="Tác giả" required></div>
          <div class="col-md-3"><input class="form-control" id="b-price" placeholder="Giá" type="number" min="0" required></div>
          <div class="col-md-3"><input class="form-control" id="b-stock" placeholder="Số lượng" type="number" min="0" value="0"></div>
          <div class="col-md-6">
            <select id="b-category" class="form-select"></select>
          </div>
          <div class="col-12"><textarea id="b-desc" class="form-control" placeholder="Mô tả"></textarea></div>
          <div class="col-md-6"><input id="b-image" type="file" class="form-control" accept="image/*"/></div>
          <div class="col-md-6"><button class="btn btn-success">Tạo sách</button></div>
        </form>
      </div>

      <div>
        <h5>Danh sách sách</h5>
        <div id="admin-books-list"></div>
      </div>
    `;

    const catSel = document.getElementById('b-category');
    catSel.innerHTML = '<option value="">Chọn danh mục</option>';
    cats.forEach(c=>{ const o = document.createElement('option'); o.value = c._id; o.textContent = c.name; catSel.appendChild(o); });

    const createForm = document.getElementById('create-book-form');
    createForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const title = document.getElementById('b-title').value.trim();
      const author = document.getElementById('b-author').value.trim();
      const price = Number(document.getElementById('b-price').value||0);
      const stock = Number(document.getElementById('b-stock').value||0);
      const category = document.getElementById('b-category').value;
      const description = document.getElementById('b-desc').value.trim();
      try{
        const res = await createBook({ title, author, price, stockQuantity: stock, category, description });
        const payload = (res && res.data) ? res.data : res;
        // upload image if selected
        const file = document.getElementById('b-image').files[0];
        if (file){
          const fd = new FormData(); fd.append('image', file);
          await uploadImageForBook(payload._id || payload.id, fd);
        }
        alert('Tạo sách thành công');
        renderAdminBooks();
      }catch(err){
        console.error(err);
        alert('Tạo sách thất bại: '+ (err.message||''));
      }
    });

    const listRoot = document.getElementById('admin-books-list');
    listRoot.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'table table-striped';
    table.innerHTML = `<thead><tr><th>Ảnh</th><th>Tiêu đề</th><th>Tác giả</th><th>Giá</th><th>Danh mục</th><th>Kho</th><th>Hành động</th></tr></thead>`;
    const tb = document.createElement('tbody');
    for (const b of books){
      const tr = document.createElement('tr');
      const img = (b.images && b.images[0]) ? (b.images[0].startsWith('/')? b.images[0] : '/uploads/'+b.images[0]) : '/uploads/image-1775355300478-674669297.jpg';
      tr.innerHTML = `
        <td style="width:80px"><img src="${img}" style="width:64px;height:64px;object-fit:cover;border-radius:6px"/></td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.price}</td>
        <td>${b.category? b.category.name : ''}</td>
        <td>${b.stockQuantity||0}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-edit">Sửa</button>
          <button class="btn btn-sm btn-danger btn-delete">Xóa</button>
          <input type="file" class="form-control form-control-sm mt-1 upload-input" accept="image/*" />
        </td>
      `;

      // events
      tr.querySelector('.btn-delete').addEventListener('click', async ()=>{
        if (!confirm('Xóa sách này?')) return;
        try{ await deleteBook(b._id || b.id); alert('Đã xóa'); renderAdminBooks(); }catch(err){ console.error(err); alert('Xóa thất bại'); }
      });

      tr.querySelector('.btn-edit').addEventListener('click', ()=>{
        // populate create form for editing
        document.getElementById('b-title').value = b.title||'';
        document.getElementById('b-author').value = b.author||'';
        document.getElementById('b-price').value = b.price||0;
        document.getElementById('b-stock').value = b.stockQuantity||0;
        document.getElementById('b-category').value = b.category? b.category._id : '';
        document.getElementById('b-desc').value = b.description || '';
        // switch create button behavior to update
        const btn = createForm.querySelector('button');
        btn.textContent = 'Cập nhật';
        btn.classList.remove('btn-success'); btn.classList.add('btn-warning');
        btn.onclick = async (ev)=>{ ev.preventDefault();
          try{
            const title = document.getElementById('b-title').value.trim();
            const author = document.getElementById('b-author').value.trim();
            const price = Number(document.getElementById('b-price').value||0);
            const stock = Number(document.getElementById('b-stock').value||0);
            const category = document.getElementById('b-category').value;
            const description = document.getElementById('b-desc').value.trim();
            await updateBook(b._id || b.id, { title, author, price, stockQuantity: stock, category, description });
            const file = document.getElementById('b-image').files[0];
            if (file){ const fd = new FormData(); fd.append('image', file); await uploadImageForBook(b._id || b.id, fd); }
            alert('Cập nhật thành công');
            // reset button
            btn.textContent = 'Tạo sách'; btn.classList.remove('btn-warning'); btn.classList.add('btn-success'); btn.onclick = null;
            createForm.reset(); renderAdminBooks();
          }catch(err){ console.error(err); alert('Cập nhật thất bại'); }
        };
      });

      const uploadInput = tr.querySelector('.upload-input');
      uploadInput.addEventListener('change', async ()=>{
        const file = uploadInput.files[0]; if (!file) return;
        try{
          const fd = new FormData(); fd.append('image', file);
          await uploadImageForBook(b._id||b.id, fd);
          alert('Upload thành công'); renderAdminBooks();
        }catch(err){ console.error(err); alert('Upload thất bại'); }
      });

      tb.appendChild(tr);
    }

    table.appendChild(tb);
    listRoot.appendChild(table);

  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu admin sách</div>';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ renderAdminBooks(); });
