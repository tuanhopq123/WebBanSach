import { getBooks, getCategories } from '../api.js';
import { createBookCard } from '../components/bookCard.js';
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

let currentPage = 1;
let pageSize = 25; // 5x5 grid

function extractBooksResponse(res){
  // support multiple shapes
  if (!res) return {books:[], totalPages:1};
  if (Array.isArray(res)) return {books:res, totalPages:1};
  if (res.data && Array.isArray(res.data)) return {books:res.data, totalPages:res.totalPages || Math.ceil((res.total||res.data.length)/pageSize)};
  if (res.docs && Array.isArray(res.docs)) return {books:res.docs, totalPages:res.totalPages || Math.ceil((res.totalDocs||res.docs.length)/pageSize)};
  if (res.books && Array.isArray(res.books)) return {books:res.books, totalPages:res.totalPages || Math.ceil((res.count||res.books.length)/pageSize)};
  // fallback
  return {books:[], totalPages:1};
}

async function loadBooks(page = 1){
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

  try{
    const res = await getBooks({ page, pageSize, search, category, author, minPrice, maxPrice, sortBy, sortOrder });
    const {books, totalPages} = extractBooksResponse(res);
    renderBooks(books);
    renderPagination(paginationEl, currentPage, totalPages, loadBooks, { pageSize, pageSizeOptions:[25,50,100], onPageSizeChange: (ps)=>{ pageSize = ps; loadBooks(1); }, showPageSize: true });
  }catch(err){
    console.error(err);
    gridEl.innerHTML = '<div class="alert alert-danger">Lỗi khi tải sách.</div>';
  }
}

function renderBooks(books){
  gridEl.innerHTML = '';
  if (!books || books.length === 0){
    gridEl.innerHTML = '<div class="p-3">Không có sách nào.</div>';
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
