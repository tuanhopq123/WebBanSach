import { getBooks, getCategories } from '../api.js';
import { renderPagination } from '../pagination.js';

const gridEl = document.getElementById('book-grid');
const paginationEl = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const categorySel = document.getElementById('filter-category');
const authorInput = document.getElementById('filter-author');
const minPriceInput = document.getElementById('filter-minprice');
const maxPriceInput = document.getElementById('filter-maxprice');
const sortSel = document.getElementById('filter-sort');
const applyBtn = document.getElementById('apply-filters');
const clearBtn = document.getElementById('clear-filters');
const countBadge = document.getElementById('books-count');

let currentPage = 1;
let pageSize = 20;

function extractBooksResponse(res){
  if (!res) return {books:[], totalPages:1, total: 0};
  if (Array.isArray(res)) return {books:res, totalPages:1, total: res.length};
  if (res.data && Array.isArray(res.data)) return {books:res.data, totalPages:res.totalPages || Math.ceil((res.total||res.data.length)/pageSize), total: res.total || res.data.length};
  return {books:[], totalPages:1, total: 0};
}

// Inline book card creation for full control of the updated design
function createBookCard(b) {
  const col = document.createElement('div');
  const imgUrl = (b.images && b.images[0]) ? (b.images[0].startsWith('/')? b.images[0] : '/uploads/'+b.images[0]) : '/uploads/image-1775355300478-674669297.jpg';
  
  const discountHtml = b.discountedPrice && b.discountedPrice < b.price 
    ? `<div class="d-flex align-items-baseline gap-2">
         <span class="price-tag">${b.discountedPrice.toLocaleString('vi-VN')}₫</span>
         <span class="text-muted text-decoration-line-through small">${b.price.toLocaleString('vi-VN')}₫</span>
       </div>`
    : `<div class="price-tag">${(b.price || 0).toLocaleString('vi-VN')}₫</div>`;

  const badgeHtml = b.discountedPrice && b.discountedPrice < b.price 
    ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2 px-2 py-1">Giảm giá</span>` 
    : '';

  col.innerHTML = `
    <div class="card h-100 position-relative">
      ${badgeHtml}
      <a href="/book.html?id=${b._id || b.id}" class="text-decoration-none">
        <img src="${imgUrl}" class="card-img-top w-100" alt="${b.title}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Img'">
      </a>
      <div class="card-body d-flex flex-column">
        <a href="/book.html?id=${b._id || b.id}" class="text-decoration-none text-dark">
          <h5 class="card-title text-truncate" title="${b.title}">${b.title}</h5>
        </a>
        <p class="card-text text-truncate mb-2" title="${b.author}">${b.author || 'Đang cập nhật'}</p>
        <div class="mt-auto">
          ${discountHtml}
        </div>
      </div>
    </div>
  `;
  return col;
}

async function loadBooks(page = 1) {
  currentPage = page;
  const search = searchInput.value.trim();
  const category = categorySel ? categorySel.value : '';
  const author = authorInput ? authorInput.value.trim() : '';
  const minPrice = minPriceInput ? minPriceInput.value : '';
  const maxPrice = maxPriceInput ? maxPriceInput.value : '';
  const sortVal = sortSel ? sortSel.value : '';
  let sortBy = 'createdAt', sortOrder = 'desc';
  
  if (sortVal){
    const [sBy, sOrd] = sortVal.split(':');
    if (sBy) sortBy = sBy;
    if (sOrd) sortOrder = sOrd;
  }

  gridEl.innerHTML = '<div class="col-12 py-5 text-center text-muted">Đang tải danh sách sách...</div>';
  
  try{
    const res = await getBooks({ page, pageSize, search, category, author, minPrice, maxPrice, sortBy, sortOrder });
    const {books, totalPages, total} = extractBooksResponse(res);
    
    if (countBadge) countBadge.textContent = `${total} sản phẩm`;
    
    renderBooks(books);
    renderPagination(paginationEl, currentPage, totalPages, loadBooks, { 
      pageSize, 
      pageSizeOptions:[20,40,80], 
      onPageSizeChange: (ps)=>{ pageSize = ps; loadBooks(1); }, 
      showPageSize: false 
    });
  }catch(err){
    console.error(err);
    gridEl.innerHTML = '<div class="col-12 alert alert-danger shadow-sm">Lỗi tải danh sách sách. Vui lòng thử lại sau.</div>';
  }
}

function renderBooks(books){
  gridEl.innerHTML = '';
  if (!books || books.length === 0){
    gridEl.innerHTML = '<div class="col-12 py-5 text-center"><h5>Không tìm thấy cuốn sách nào phù hợp 😢</h5><p class="text-muted">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p></div>';
    return;
  }
  const frag = document.createDocumentFragment();
  books.forEach(b => frag.appendChild(createBookCard(b)));
  gridEl.appendChild(frag);
}

searchInput.addEventListener('keypress', (e)=>{ if (e.key==='Enter') loadBooks(1); });

applyBtn && applyBtn.addEventListener('click', ()=> loadBooks(1));
clearBtn && clearBtn.addEventListener('click', ()=>{
  if (categorySel) categorySel.value = '';
  if (authorInput) authorInput.value = '';
  if (minPriceInput) minPriceInput.value = '';
  if (maxPriceInput) maxPriceInput.value = '';
  if (sortSel) sortSel.value = 'createdAt:desc';
  searchInput.value = '';
  loadBooks(1);
});

async function loadCategories(){
  if (!categorySel) return;
  try{
    const res = await getCategories();
    const cats = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c._id || c.id;
      opt.textContent = c.name || c.title || 'Unknown';
      categorySel.appendChild(opt);
    });
  }catch(err){ console.warn('Không thể tải categories', err); }
}

document.addEventListener('DOMContentLoaded', ()=>{ loadCategories().then(()=>loadBooks(1)); });
