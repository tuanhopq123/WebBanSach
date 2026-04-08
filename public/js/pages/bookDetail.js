import { getBookById, createReview, addToCart } from '../api.js';

function getQueryParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
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

function buildCarousel(images){
  if (!images || images.length === 0) return `<img src="https://via.placeholder.com/400x550?text=No+Img" class="w-100 rounded-4 shadow-sm" style="object-fit:cover;height:550px;" />`;
  const id = `carousel-${Date.now()}`;
  const inner = images.map((img, idx)=>`
    <div class="carousel-item ${idx===0? 'active':''} text-center">
      <img src="${img.startsWith('/')? img : '/uploads/'+img}" class="d-block mx-auto rounded-4 shadow-sm" style="height:550px;object-fit:contain;background-color:#f8fafc;" />
    </div>
  `).join('');
  
  if(images.length === 1) {
    return `<div class="text-center book-image-carousel">${inner}</div>`;
  }
  
  return `
    <div id="${id}" class="carousel slide book-image-carousel" data-bs-ride="carousel">
      <div class="carousel-inner">${inner}</div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev"><span class="carousel-control-prev-icon" style="filter:invert(1);"></span></button>
      <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next"><span class="carousel-control-next-icon" style="filter:invert(1);"></span></button>
    </div>
  `;
}

function renderReviews(reviews){
  if (!reviews || reviews.length === 0) return '<div class="text-muted text-center py-4">Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên!</div>';
  return reviews.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `
      <div class="review-card">
        <div class="d-flex justify-content-between mb-2 align-items-center">
          <strong class="text-dark">${r.user? r.user.username : 'Khách hàng ẩn danh'}</strong>
          <span class="text-muted small">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
        <div class="stars mb-2" style="font-size:1.1rem;letter-spacing:2px;">${stars}</div>
        <p class="mb-0 text-secondary">${r.comment || '<i>Không có nội dung nhận xét</i>'}</p>
      </div>
    `;
  }).join('');
}

async function loadDetail(){
  const id = getQueryParam('id');
  const root = document.getElementById('book-detail');
  if (!id){ root.innerHTML = '<div class="alert alert-warning mt-4">ID sách không hợp lệ. Vui lòng quay lại cửa hàng.</div>'; return; }
  
  try{
    const res = await getBookById(id);
    const payload = (res && res.data) ? res.data : res;
    const book = payload;
    const images = book.images || [];
    const reviews = book.reviews || [];

    const isDiscounted = book.discountedPrice && book.discountedPrice < book.price;
    const priceHtml = isDiscounted
      ? `<span class="discount-price">${book.discountedPrice.toLocaleString()}₫</span> <span class="original-price">${book.price.toLocaleString()}₫</span>
         <span class="badge bg-badge ms-2 px-2 py-1 rounded-pill">Giảm giá sốc</span>`
      : `<span class="discount-price">${(book.price || 0).toLocaleString()}₫</span>`;

    const catName = book.category ? (book.category.name || '') : 'Chung';

    root.innerHTML = `
      <div class="book-detail-wrapper">
        <div class="row g-5">
          <div class="col-md-5">
            ${buildCarousel(images)}
          </div>
          <div class="col-md-7">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/" class="text-decoration-none text-primary">Cửa hàng</a></li>
                <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-secondary">${catName}</a></li>
                <li class="breadcrumb-item active" aria-current="page">Chi tiết</li>
              </ol>
            </nav>
            
            <h1 class="book-title">${book.title || 'Đang cập nhật'}</h1>
            <p class="book-author">Tác giả: <strong>${book.author || 'Đang cập nhật'}</strong></p>
            
            <div class="book-price-box d-flex align-items-center">
              ${priceHtml}
            </div>
            
            <div class="mb-4">
              <h5 class="fw-bold mb-2">Thông tin chi tiết</h5>
              <p class="text-secondary" style="line-height:1.7;">${book.description ? book.description.replace(/\n/g, '<br>') : 'Chưa có thông tin mô tả cho cuốn sách này.'}</p>
            </div>
            
            <div class="d-flex gap-3 align-items-center mt-4 border-top pt-4">
              <div class="input-group" style="width: 140px;">
                <button class="btn btn-outline-secondary px-3" type="button" id="btn-decr-qty">-</button>
                <input id="qty-input" type="number" min="1" max="${book.stockQuantity || 1}" value="1" class="form-control text-center fw-bold bg-white" readonly />
                <button class="btn btn-outline-secondary px-3" type="button" id="btn-incr-qty">+</button>
              </div>
              <button id="add-cart-btn" class="btn btn-add-cart w-100 d-flex align-items-center justify-content-center gap-2">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                THÊM VÀO GIỎ HÀNG
              </button>
            </div>
            ${(!book.stockQuantity || book.stockQuantity <= 0) ? '<div class="text-danger mt-2 fw-semibold">Sản phẩm này tạm thời hết hàng</div>' : `<div class="text-muted small mt-2">Còn lại <span class="fw-bold">${book.stockQuantity}</span> cuốn trong kho</div>`}
          </div>
        </div>
      </div>

      <div class="reviews-section">
        <h4 class="fw-bold mb-4">Đánh giá từ độc giả</h4>
        <div id="reviews-root">${renderReviews(reviews)}</div>
      </div>
    `;

    // Qty logic
    const qtyInput = document.getElementById('qty-input');
    const maxStock = book.stockQuantity || 1;
    document.getElementById('btn-decr-qty').addEventListener('click', () => {
      let v = parseInt(qtyInput.value) || 1;
      if (v > 1) qtyInput.value = v - 1;
    });
    document.getElementById('btn-incr-qty').addEventListener('click', () => {
      let v = parseInt(qtyInput.value) || 1;
      if (v < maxStock) qtyInput.value = v + 1;
    });

    const addCartBtn = document.getElementById('add-cart-btn');
    if (!book.stockQuantity || book.stockQuantity <= 0) {
        addCartBtn.disabled = true;
        addCartBtn.innerHTML = 'HẾT HÀNG';
        addCartBtn.classList.replace('btn-add-cart', 'btn-secondary');
    } else {
        addCartBtn.addEventListener('click', async ()=>{
          addCartBtn.disabled = true;
          const originalText = addCartBtn.innerHTML;
          addCartBtn.textContent = 'ĐANG THÊM...';
          const qty = Number(qtyInput.value||1);
          try{
            await addToCart({ bookId: book._id || book.id, quantity: qty });
            showToast('Thêm vào giỏ hàng thành công! 🛒');
          }catch(err){
            console.error(err);
            showToast('Không thể thêm vào giỏ hàng: ' + (err.message || ''), 'error');
          }finally{
            addCartBtn.disabled = false;
            addCartBtn.innerHTML = originalText;
          }
        });
    }



  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger mt-4">Lỗi: Không tìm thấy sách này hoặc đã bị xóa.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadDetail);
