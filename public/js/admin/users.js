import { getUsers, updateUser, deleteUser } from '../api.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  const root = document.getElementById('admin-users-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    async function render(){
      const r = await getUsers();
      const list = (r && r.data) ? r.data : (Array.isArray(r)? r: []);
      root.innerHTML = '';
      const table = document.createElement('table'); table.className='table';
      table.innerHTML = '<thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Hành động</th></tr></thead>';
      const tb = document.createElement('tbody');
      list.forEach(u=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${u.username}</td><td>${u.email}</td><td>${u.role && u.role.name? u.role.name : (u.role||'')}</td><td><button class="btn btn-sm btn-warning btn-edit">Sửa</button> <button class="btn btn-sm btn-danger btn-del">Xóa</button></td>`;
        tr.querySelector('.btn-del').addEventListener('click', async ()=>{ if(!confirm('Xóa user?')) return; await deleteUser(u._id||u.id); render(); });
        tr.querySelector('.btn-edit').addEventListener('click', ()=>{
          const newRole = prompt('Role (Admin/Staff/Customer)', u.role && u.role.name ? u.role.name : 'Customer'); if (!newRole) return; updateUser(u._id||u.id, { role: newRole }).then(()=>render()).catch(err=>{console.error(err); alert('Lỗi')});
        });
        tb.appendChild(tr);
      });
      table.appendChild(tb); root.appendChild(table);
    }

    render();
  }catch(err){ console.error(err); root.innerHTML = '<div class="alert alert-danger">Không thể tải users</div>'; }
});
