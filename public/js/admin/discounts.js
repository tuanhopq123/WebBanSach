import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../api.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  const root = document.getElementById('admin-discounts-root');
  if (!root) return;
  root.innerHTML = 'Đang tải...';
  try{
    root.innerHTML = `
      <div class="mb-3">
        <form id="create-discount-form" class="row g-2">
          <div class="col-md-3"><input id="d-code" class="form-control" placeholder="Mã giảm giá" required /></div>
          <div class="col-md-3"><input id="d-percent" class="form-control" type="number" placeholder="% giảm" /></div>
          <div class="col-md-3"><input id="d-amount" class="form-control" type="number" placeholder="Số tiền giảm" /></div>
          <div class="col-md-3"><button class="btn btn-success">Tạo</button></div>
        </form>
      </div>
      <div id="discount-list"></div>
    `;

    document.getElementById('create-discount-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const code = document.getElementById('d-code').value.trim();
      const discountPercentage = Number(document.getElementById('d-percent').value||0);
      const discountAmount = Number(document.getElementById('d-amount').value||0);
      try{ await createDiscount({ code, discountPercentage, discountAmount }); alert('Tạo thành công'); renderList(); }catch(err){ console.error(err); alert('Tạo thất bại'); }
    });

    async function renderList(){
      const r = await getDiscounts();
      const list = (r && r.data) ? r.data : (Array.isArray(r)? r: []);
      const rootList = document.getElementById('discount-list'); rootList.innerHTML = '';
      const table = document.createElement('table'); table.className='table';
      table.innerHTML = '<thead><tr><th>Mã</th><th>%</th><th>Số tiền</th><th>Hành động</th></tr></thead>';
      const tb = document.createElement('tbody');
      list.forEach(d=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${d.code}</td><td>${d.discountPercentage||0}</td><td>${d.discountAmount||0}</td><td><button class="btn btn-sm btn-warning btn-edit">Sửa</button> <button class="btn btn-sm btn-danger btn-del">Xóa</button></td>`;
        tr.querySelector('.btn-del').addEventListener('click', async ()=>{ if(!confirm('Xóa?')) return; await deleteDiscount(d._id||d.id); renderList(); });
        tr.querySelector('.btn-edit').addEventListener('click', ()=>{
          const percent = prompt('Phần trăm giảm', d.discountPercentage||0);
          const amount = prompt('Số tiền giảm', d.discountAmount||0);
          updateDiscount(d._id||d.id, { discountPercentage: Number(percent||0), discountAmount: Number(amount||0) }).then(()=>renderList()).catch(err=>{console.error(err); alert('Lỗi')});
        });
        tb.appendChild(tr);
      });
      table.appendChild(tb); rootList.appendChild(table);
    }

    renderList();

  }catch(err){ console.error(err); root.innerHTML = '<div class="alert alert-danger">Không thể tải discounts</div>'; }
});
