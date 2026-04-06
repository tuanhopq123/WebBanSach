import { apiGet, logout as apiLogout } from './api.js';

function qs(selector){ return document.querySelector(selector); }

async function fetchProfile(){
  try{
    const res = await apiGet('/api/users/profile');
    // server returns { success:true, data: user }
    if (res && res.data) return res.data;
    return null;
  }catch(err){
    return null;
  }
}

function buildUserMenu(user){
  const li = document.createElement('li');
  li.className = 'nav-item dropdown';
  const a = document.createElement('a');
  a.className = 'nav-link dropdown-toggle text-white';
  a.href = '#';
  a.id = 'userMenu';
  a.setAttribute('data-bs-toggle','dropdown');
  a.textContent = user.username || user.email || 'Tài khoản';

  const ul = document.createElement('ul');
  ul.className = 'dropdown-menu dropdown-menu-end';
  const profile = document.createElement('li');
  profile.innerHTML = `<a class="dropdown-item" href="/profile.html">Hồ sơ</a>`;
  ul.appendChild(profile);
  if (user.role && (user.role==='Admin' || user.role==='Staff')){
    const admin = document.createElement('li');
    admin.innerHTML = `<a class="dropdown-item" href="/admin/index.html">Quản trị</a>`;
    ul.appendChild(admin);
  }
  const logoutLi = document.createElement('li');
  logoutLi.innerHTML = `<a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a>`;
  ul.appendChild(logoutLi);

  li.appendChild(a);
  li.appendChild(ul);
  return li;
}

export async function initUI(){
  const loginLink = document.querySelector('a[href="/login.html"]');
  if (!loginLink) return;
  const token = localStorage.getItem('wbs_token');
  if (!token) return; // not logged in
  const user = await fetchProfile();
  if (!user) return;

  const nav = loginLink.closest('.navbar').querySelector('.navbar-nav');
  if (!nav) return;
  // remove existing login link
  const loginLi = loginLink.closest('li');
  if (loginLi) loginLi.remove();

  // add user menu
  const menu = buildUserMenu(user);
  nav.appendChild(menu);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e)=>{ e.preventDefault(); apiLogout(); window.location.reload(); });
}

document.addEventListener('DOMContentLoaded', ()=>{ initUI().catch(()=>{}); });
