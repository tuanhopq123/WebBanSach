import { getCategories, createCategory, updateCategory, deleteCategory } from '../api.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  const root = document.getElementById('admin-categories-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    const res = await getCategories();
    const cats = (res && res.data) ? res.data : (Array.isArray(res)? res: []);
    root.innerHTML = `
      <div class="mb-3">
        <form id="create-cat-form" class="d-flex gap-2">
          <input id="cat-name" class="form-control" placeholder="Tên danh mục" required />
          <button class="btn btn-success">Tạo</button>
        </form>
      </div>
      <div id="cat-list"></div>
    `;

    document.getElementById('create-cat-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('cat-name').value.trim();
      try{ await createCategory({ name }); alert('Tạo thành công'); renderList(); }catch(err){ console.error(err); alert('Tạo thất bại'); }
    });

    async function renderList(){
      const r = await getCategories();
      const list = (r && r.data) ? r.data : (Array.isArray(r)? r: []);
      const rootList = document.getElementById('cat-list');
      rootList.innerHTML = '';
      const table = document.createElement('table'); table.className='table';
      table.innerHTML = '<thead><tr><th>Tên</th><th>Hành động</th></tr></thead>';
      const tb = document.createElement('tbody');
      list.forEach(c=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.name}</td><td><button class="btn btn-sm btn-warning btn-edit">Sửa</button> <button class="btn btn-sm btn-danger btn-del">Xóa</button></td>`;
        tr.querySelector('.btn-del').addEventListener('click', async ()=>{ if(!confirm('Xóa?')) return; await deleteCategory(c._id||c.id); renderList(); });
        tr.querySelector('.btn-edit').addEventListener('click', ()=>{
          const newName = prompt('Tên mới', c.name); if (!newName) return; updateCategory(c._id||c.id, { name: newName }).then(()=>renderList()).catch(err=>{console.error(err);alert('Lỗi')});
        });
        tb.appendChild(tr);
      });
      table.appendChild(tb); rootList.appendChild(table);
    }

    renderList();

  }catch(err){ console.error(err); root.innerHTML = '<div class="alert alert-danger">Không thể tải danh mục</div>'; }
});
