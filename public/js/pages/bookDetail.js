import { getBookById, createReview, addToCart } from '../api.js';

function getQueryParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function buildCarousel(images){
  if (!images || images.length===0) return '<div class="mb-3">No images</div>';
  const id = `carousel-${Date.now()}`;
  const inner = images.map((img, idx)=>`
    <div class="carousel-item ${idx===0? 'active':''}">
      <img src="${img.startsWith('/')? img : '/uploads/'+img}" class="d-block w-100" style="height:420px;object-fit:cover;" />
    </div>
  `).join('');
  return `
    <div id="${id}" class="carousel slide mb-3" data-bs-ride="carousel">
      <div class="carousel-inner">${inner}</div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button>
      <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button>
    </div>
  `;
}

function renderReviews(reviews){
  if (!reviews || reviews.length===0) return '<div>Chưa có đánh giá nào.</div>';
  return reviews.map(r=>`
    <div class="mb-2 border-bottom pb-2">
      <strong>${r.user? r.user.username : 'Khách'}</strong> <span class="text-muted">— ${new Date(r.createdAt).toLocaleString()}</span>
      <div>Rating: ${r.rating}/5</div>
      <div>${r.comment}</div>
    </div>
  `).join('');
}

async function loadDetail(){
  const id = getQueryParam('id');
  const root = document.getElementById('book-detail');
  if (!id){ root.innerHTML = '<div class="alert alert-warning">ID sách không hợp lệ.</div>'; return; }
  try{
    const res = await getBookById(id);
    const payload = (res && res.data) ? res.data : res;
    const book = payload;
    const images = book.images || [];
    const reviews = book.reviews || [];

    root.innerHTML = `
      <div class="row">
        <div class="col-md-6">${buildCarousel(images)}</div>
        <div class="col-md-6">
          <h3>${book.title || ''}</h3>
          <div class="text-muted">${book.author || ''}</div>
          <div class="h4 mt-3 text-success">${book.discountedPrice? (book.discountedPrice.toLocaleString() + ' VNĐ') : (book.price? (book.price.toLocaleString()+' VNĐ') : '')}</div>
          <p class="mt-3">${book.description || ''}</p>
          <div>Danh mục: ${book.category ? (book.category.name || '') : ''}</div>
          <div class="mt-3">
            <div class="input-group mb-2" style="max-width:180px;">
              <input id="qty-input" type="number" min="1" value="1" class="form-control" />
              <button id="add-cart-btn" class="btn btn-primary">Thêm vào giỏ</button>
            </div>
          </div>
        </div>
      </div>
      <hr/>
      <h5>Đánh giá</h5>
      <div id="reviews-root">${renderReviews(reviews)}</div>
      <div class="mt-3">
        <h6>Viết đánh giá</h6>
        <form id="review-form">
          <div class="mb-2"><input type="number" id="review-rating" min="1" max="5" class="form-control" placeholder="Rating 1-5" required></div>
          <div class="mb-2"><textarea id="review-comment" class="form-control" placeholder="Nội dung" rows="3"></textarea></div>
          <button class="btn btn-sm btn-success">Gửi</button>
        </form>
      </div>
    `;

    document.getElementById('add-cart-btn').addEventListener('click', async ()=>{
      const qty = Number(document.getElementById('qty-input').value||1);
      try{
        await addToCart({ bookId: book._id || book.id, quantity: qty });
        alert('Đã thêm vào giỏ hàng');
      }catch(err){
        console.error(err);
        alert('Không thể thêm vào giỏ hàng');
      }
    });

    document.getElementById('review-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const rating = Number(document.getElementById('review-rating').value);
      const comment = document.getElementById('review-comment').value.trim();
      try{
        await createReview({ book: book._id || book.id, rating, comment });
        alert('Cảm ơn đánh giá của bạn');
        loadDetail();
      }catch(err){
        console.error(err);
        alert('Không thể gửi đánh giá');
      }
    });

  }catch(err){
    console.error(err);
    root.innerHTML = '<div class="alert alert-danger">Không tải được thông tin sách.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadDetail);
