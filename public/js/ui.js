import { apiGet, apiPut, logout as apiLogout } from './api.js';

function qs(selector) { return document.querySelector(selector); }

async function fetchProfile() {
  try {
    const res = await apiGet('/api/users/profile');
    if (res && res.data) return res.data;
    return null;
  } catch (err) { return null; }
}

async function fetchNotifications() {
  try {
    const res = await apiGet('/api/notifications');
    return (res && res.data) ? res.data : [];
  } catch (err) { return []; }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return Math.floor(seconds) + " giây trước";
}

function buildNotificationMenu(notifications) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const li = document.createElement('li');
  li.className = 'nav-item dropdown ms-lg-2';

  const a = document.createElement('a');
  a.className = 'nav-link btn btn-light text-primary fw-semibold px-3 py-1 mt-1 rounded-pill position-relative';
  a.href = '#';
  a.setAttribute('data-bs-toggle', 'dropdown');
  a.innerHTML = `🔔 <span class="d-none d-lg-inline">Thông báo</span>
        ${unreadCount > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.65rem;">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
    `;

  const ul = document.createElement('ul');
  ul.className = 'dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-4 p-0';
  ul.style.width = '350px';
  ul.style.maxHeight = '400px';
  ul.style.overflowY = 'auto';

  const header = document.createElement('li');
  header.className = 'p-3 border-bottom d-flex justify-content-between align-items-center bg-light sticky-top rounded-top-4';
  header.innerHTML = `
        <span class="fw-bold mb-0">Thông báo của bạn</span>
        ${unreadCount > 0 ? `<button class="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-semibold" id="mark-all-read">Đánh dấu đã đọc</button>` : ''}
    `;
  ul.appendChild(header);

  if (notifications.length === 0) {
    ul.innerHTML += `<li class="p-4 text-center text-muted small">Bạn không có thông báo nào.</li>`;
  } else {
    notifications.forEach(n => {
      const item = document.createElement('li');
      const isReadClass = n.isRead ? 'opacity-75' : 'bg-primary bg-opacity-10 fw-semibold';
      const dot = n.isRead ? '' : '<span class="p-1 bg-primary rounded-circle d-inline-block me-2"></span>';

      item.innerHTML = `
                <a class="dropdown-item p-3 border-bottom text-wrap ${isReadClass}" href="${n.link || '#'}" data-id="${n._id}">
                    <div class="d-flex w-100 justify-content-between mb-1">
                        <span class="small">${dot}${n.title}</span>
                        <small class="text-muted" style="font-size:0.7rem;">${timeAgo(n.createdAt)}</small>
                    </div>
                    <p class="mb-0 text-dark small" style="white-space: normal; line-height: 1.4;">${n.message}</p>
                </a>
            `;
      ul.appendChild(item);
    });
  }

  li.appendChild(a);
  li.appendChild(ul);

  ul.addEventListener('click', async (e) => {
    const link = e.target.closest('.dropdown-item');
    if (link && link.dataset.id) {
      try {
        await apiPut(`/api/notifications/${link.dataset.id}/read`);
      } catch (e) { }
    }
  });

  return li;
}

function buildUserMenu(user) {
  const li = document.createElement('li');
  li.className = 'nav-item dropdown ms-lg-2';

  const a = document.createElement('a');
  a.className = 'nav-link dropdown-toggle btn btn-light text-primary fw-semibold px-3 py-1 mt-1 rounded-pill';
  a.href = '#';
  a.id = 'userMenu';
  a.setAttribute('data-bs-toggle', 'dropdown');
  a.innerHTML = `👤 ${user.username || user.email || 'Tài khoản'}`;

  const ul = document.createElement('ul');
  ul.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 rounded-3';

  const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
  const isAdminOrStaff = (roleName === 'Admin' || roleName === 'Staff');
  const profileText = isAdminOrStaff ? '👤 Hồ sơ' : '📦 Lịch sử & Hồ sơ';

  ul.innerHTML += `<li><a class="dropdown-item py-2 fw-semibold" href="/profile.html">${profileText}</a></li>`;

  if (isAdminOrStaff) {
    ul.innerHTML += `<li><a class="dropdown-item py-2 fw-semibold text-danger" href="/admin/index.html">⚙️ Trang Quản Trị</a></li>`;
  }

  ul.innerHTML += `<li><hr class="dropdown-divider"></li>`;
  ul.innerHTML += `<li><a class="dropdown-item py-2" href="#" id="logout-btn">Đăng xuất</a></li>`;

  li.appendChild(a);
  li.appendChild(ul);
  return li;
}

export async function initUI() {
  const path = window.location.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isCustomerRoute = path.includes('/cart.html') || path.includes('/checkout.html');

  const token = localStorage.getItem('wbs_token');
  let user = null;

  if (token) {
    user = await fetchProfile();
  }

  const roleName = user ? (typeof user.role === 'object' && user.role !== null ? user.role.name : user.role) : null;
  const isAdminOrStaff = roleName === 'Admin' || roleName === 'Staff';

  if (isAdminRoute && !isAdminOrStaff) {
    alert('⛔ Truy cập bị từ chối! Khu vực chỉ dành cho Ban Quản Trị.');
    window.location.href = '/';
    return;
  }

  if (isCustomerRoute && isAdminOrStaff) {
    alert('🛡️ Ban Quản Trị không được phép sử dụng chức năng mua sắm!');
    window.location.href = '/admin/index.html';
    return;
  }

  const nav = document.querySelector('.navbar-nav.ms-auto');
  if (!nav) return;

  const oldLogin = nav.querySelector('a[href="/login.html"]');
  if (oldLogin && oldLogin.closest('li')) oldLogin.closest('li').remove();

  if (isAdminOrStaff) {
    const cartLink = nav.querySelector('a[href="/cart.html"]');
    if (cartLink && cartLink.closest('li')) cartLink.closest('li').remove();
  }

  if (user) {
    // 1. Tải và Gắn Menu Thông báo
    const notifications = await fetchNotifications();
    const notifMenu = buildNotificationMenu(notifications);
    nav.appendChild(notifMenu);

    // Bắt sự kiện đánh dấu tất cả đã đọc (Đã sửa URL API)
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await apiPut('/api/notifications/read-all'); // Đã khớp với BE của bạn
          // Tải lại navbar sau khi mark read
          const newNav = document.querySelector('.navbar-nav.ms-auto');
          newNav.innerHTML = '';
          const newNotifs = await fetchNotifications();
          newNav.appendChild(buildNotificationMenu(newNotifs));
          newNav.appendChild(buildUserMenu(user));
        } catch (e) { }
      });
    }

    // 2. Gắn Menu User (Hồ sơ)
    const userMenu = buildUserMenu(user);
    nav.appendChild(userMenu);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiLogout();
      window.location.href = '/login.html';
    });
  } else {
    const loginLi = document.createElement('li');
    loginLi.className = 'nav-item ms-lg-2';
    loginLi.innerHTML = `<a class="nav-link btn btn-light text-primary fw-semibold px-4 py-1 mt-1 rounded-pill" href="/login.html">Đăng nhập</a>`;
    nav.appendChild(loginLi);
  }
}

document.addEventListener('DOMContentLoaded', () => { initUI().catch(() => { }); });