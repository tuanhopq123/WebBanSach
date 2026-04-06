export function createBookCard(book){
  const col = document.createElement('div');
  col.className = 'book-card';

  const img = document.createElement('img');
  let src = '/uploads/image-1775355300478-674669297.jpg';
  if (book && book.images && book.images.length>0){
    const first = book.images[0];
    if (first.startsWith('http')) src = first;
    else if (first.startsWith('/')) src = first;
    else src = `/uploads/${first}`;
  }
  img.src = src;
  img.alt = book.title || 'book';

  const title = document.createElement('div');
  title.className = 'title';
  const a = document.createElement('a');
  a.href = `/book.html?id=${book._id || book.id}`;
  a.textContent = book.title || 'Không có tiêu đề';
  title.appendChild(a);

  const author = document.createElement('div');
  author.className = 'author';
  author.textContent = book.author || '';

  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = (book.price!=null) ? `${book.price.toLocaleString()} VNĐ` : '';

  const bottom = document.createElement('div');
  bottom.style.marginTop = 'auto';
  const stock = document.createElement('span');
  stock.className = 'badge bg-' + ((book.stockQuantity>0)?'success':'secondary') + ' badge-stock';
  stock.textContent = (book.stockQuantity>0)?'Còn hàng':'Hết hàng';

  col.appendChild(img);
  col.appendChild(title);
  col.appendChild(author);
  col.appendChild(price);
  bottom.appendChild(stock);
  col.appendChild(bottom);

  return col;
}
