// Lightweight API wrapper (ES module)
const tokenKey = 'wbs_token';

function buildQuery(params = {}){
  const qs = new URLSearchParams();
  for (const k of Object.keys(params || {})){
    const v = params[k];
    if (v === undefined || v === null || v === '') continue;
    qs.append(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function getToken(){
  return localStorage.getItem(tokenKey);
}

async function request(method, path, {params, body, asJson=true} = {}){
  const url = path + buildQuery(params);
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  let resp;
  try{
    resp = await fetch(url, {method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined});
  }catch(err){
    const e = new Error('Network error');
    e.cause = err;
    throw e;
  }

  const contentType = resp.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')){
    payload = await resp.json().catch(()=>null);
  }else{
    payload = await resp.text().catch(()=>null);
  }

  if (!resp.ok){
    const message = payload && payload.message ? payload.message : (typeof payload === 'string' ? payload : JSON.stringify(payload || {}));
    const err = new Error(message || resp.statusText || 'HTTP error');
    err.status = resp.status;
    err.payload = payload;
    throw err;
  }

  if (!asJson) return resp;
  return payload;
}

export async function apiGet(path, params){
  return request('GET', path, {params});
}

export async function apiPost(path, body){
  return request('POST', path, {body});
}

export async function apiPut(path, body){
  return request('PUT', path, {body});
}

export async function apiDelete(path, params){
  return request('DELETE', path, {params});
}

/* Domain helpers */
export async function getBooks(options = {}){
  // Normalize options to match server expectations (server expects `page` and `limit`)
  const params = Object.assign({}, options);
  if (params.pageSize && !params.limit) {
    params.limit = params.pageSize;
    delete params.pageSize;
  }
  // server supports minPrice/maxPrice naming (minPrice/maxPrice)
  return apiGet('/api/books', params);
}

export async function getBookById(id){
  return apiGet(`/api/books/${id}`);
}

/* Books CRUD */
export async function createBook(payload){
  return apiPost('/api/books', payload);
}

export async function updateBook(id, payload){
  return apiPut(`/api/books/${id}`, payload);
}

export async function deleteBook(id){
  return apiDelete(`/api/books/${id}`);
}

export async function getCategories(){
  return apiGet('/api/categories');
}

export async function getCategoryById(id){
  return apiGet(`/api/categories/${id}`);
}

export async function createCategory(payload){
  return apiPost('/api/categories', payload);
}

export async function updateCategory(id, payload){
  return apiPut(`/api/categories/${id}`, payload);
}

export async function deleteCategory(id){
  return apiDelete(`/api/categories/${id}`);
}

export async function getReviewsByBook(bookId, params){
  return apiGet(`/api/reviews/book/${bookId}`, params);
}

export async function createReview(payload){
  return apiPost('/api/reviews', payload);
}

export async function login(credentials){
  const res = await apiPost('/api/users/login', credentials);
  // support multiple shapes: { accessToken }, { token }, { data: { accessToken } }
  const token = (res && (res.accessToken || res.token)) || (res && res.data && (res.data.accessToken || res.data.token));
  if (token) localStorage.setItem(tokenKey, token);
  return res;
}

export function logout(){
  localStorage.removeItem(tokenKey);
}

export async function uploadImage(path, formData){
  const url = path;
  const token = getToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const resp = await fetch(url, {method:'POST', headers, body: formData});
  if (!resp.ok){
    const txt = await resp.text().catch(()=>null);
    throw new Error(txt || 'Upload failed');
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return resp.json();
  return resp.text();
}

export async function uploadImageForBook(bookId, formData){
  return uploadImage(`/api/books/${bookId}/upload`, formData);
}

export async function uploadImageGeneric(formData){
  return uploadImage(`/api/images/upload`, formData);
}

/* Cart */
export async function getCart(){
  return apiGet('/api/cart');
}

export async function addToCart(payload){
  return apiPost('/api/cart', payload);
}

export async function updateCartItem(payload){
  return apiPut('/api/cart/update', payload);
}

export async function clearCart(){
  return apiDelete('/api/cart');
}

/* Orders */
export async function checkoutOrder(payload){
  return apiPost('/api/orders/checkout', payload);
}

export async function getMyOrders(){
  return apiGet('/api/orders/my-orders');
}

export async function getOrderById(id){
  return apiGet(`/api/orders/${id}`);
}

export async function simulatePayment(orderId){
  return apiPost('/api/payments/simulate', { orderId });
}

/* Discounts */
export async function getDiscounts(params){
  return apiGet('/api/discounts', params);
}

export async function createDiscount(payload){
  return apiPost('/api/discounts', payload);
}

export async function applyDiscount(id, payload){
  return apiPost(`/api/discounts/${id}/apply`, payload);
}

export async function removeDiscount(id, payload){
  return apiPost(`/api/discounts/${id}/remove`, payload);
}

export async function updateDiscount(id, payload){
  return apiPut(`/api/discounts/${id}`, payload);
}

export async function deleteDiscount(id){
  return apiDelete(`/api/discounts/${id}`);
}

/* Users */
export async function register(userData){
  return apiPost('/api/users/register', userData);
}

export async function getUsers(params){
  return apiGet('/api/users', params);
}

export async function getUserById(id){
  return apiGet(`/api/users/${id}`);
}

export async function updateUser(id, payload){
  return apiPut(`/api/users/${id}`, payload);
}

export async function deleteUser(id){
  return apiDelete(`/api/users/${id}`);
}

