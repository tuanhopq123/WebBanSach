import { apiGet, logout as apiLogout } from './api.js';

function qs(selector){ return document.querySelector(selector); }

async function fetchProfile(){
  try{
    const res = await apiGet('/api/users/profile');
    if (res && res.data) return res.data;
    return null;
  }catch(err){
    return null;
  }
}

function buildUserMenu(user){
  const li = document.createElement('li');
  li.className = 'nav-item dropdown ms-lg-2';
  
  const a = document.createElement('a');
  a.className = 'nav-link dropdown-toggle btn btn-light text-primary fw-semibold px-3 py-1 mt-1 rounded-pill';
  a.href = '#';
  a.id = 'userMenu';
  a.setAttribute('data-bs-toggle','dropdown');
  a.innerHTML = `👤 ${user.username || user.email || 'Tài khoản'}`;

  const ul = document.createElement('ul');
  ul.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 rounded-3';
  
  const profile = document.createElement('li');
  profile.innerHTML = `<a class="dropdown-item py-2 fw-semibold" href="/profile.html">📦 Lịch sử & Hồ sơ</a>`;
  ul.appendChild(profile);
  
  const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
  if (roleName && (roleName === 'Admin' || roleName === 'Staff')){
    const admin = document.createElement('li');
    admin.innerHTML = `<a class="dropdown-item py-2 fw-semibold text-danger" href="/admin/index.html">⚙️ Trang Quản Trị</a>`;
    ul.appendChild(admin);
  }
  
  ul.appendChild(document.createElement('hr')).className = "dropdown-divider";
  
  const logoutLi = document.createElement('li');
  logoutLi.innerHTML = `<a class="dropdown-item py-2" href="#" id="logout-btn">Thoát</a>`;
  ul.appendChild(logoutLi);

  li.appendChild(a);
  li.appendChild(ul);
  return li;
}

export async function initUI(){
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const token = localStorage.getItem('wbs_token');
  let user = null;

  if (token) {
    user = await fetchProfile();
  }

  if (isAdminRoute) {
    const roleName = user ? (typeof user.role === 'object' && user.role !== null ? user.role.name : user.role) : null;
    if (!roleName || (roleName !== 'Admin' && roleName !== 'Staff')) {
      alert('Bạn không có quyền! Chức năng này chỉ dành cho Admin.');
      window.location.href = '/';
      return;
    }
  }

  const nav = document.querySelector('.navbar-nav.ms-auto');
  if (!nav) return;

  // Clear existing static auth links if perfectly matches
  const oldLogin = nav.querySelector('a[href="/login.html"]');
  if (oldLogin && oldLogin.closest('li')) oldLogin.closest('li').remove();
  const oldProfile = nav.querySelector('a[href="/profile.html"]');
  if (oldProfile && oldProfile.closest('li')) oldProfile.closest('li').remove();
  const oldLogout = nav.querySelector('#btn-logout');
  if (oldLogout && oldLogout.closest('li')) oldLogout.closest('li').remove();

  if (user) {
    // Add user menu
    const menu = buildUserMenu(user);
    nav.appendChild(menu);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e)=>{ 
      e.preventDefault(); 
      apiLogout(); 
      window.location.href = '/login.html'; 
    });
  } else {
    // Add login button
    const loginLi = document.createElement('li');
    loginLi.className = 'nav-item ms-lg-2';
    loginLi.innerHTML = `<a class="nav-link btn btn-light text-primary fw-semibold px-4 py-1 mt-1 rounded-pill" href="/login.html">Đăng nhập</a>`;
    nav.appendChild(loginLi);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ initUI().catch(()=>{}); });
