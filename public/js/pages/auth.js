import { login, register } from '../api.js';

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

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('auth-root');
  if (!root) return;

  root.innerHTML = `
    <ul class="nav nav-tabs" id="authTabs">
      <li class="nav-item">
        <a class="nav-link active" href="#" data-tab="login">Đăng nhập</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="register">Đăng ký</a>
      </li>
    </ul>

    <div id="auth-forms">
      <form id="login-form">
        <div class="mb-3">
          <label class="form-label fw-semibold small text-muted mb-1">Email <span class="text-danger">*</span></label>
          <input id="login-email" class="form-control" name="email" placeholder="example@gmail.com" required/>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold small text-muted mb-1">Mật khẩu <span class="text-danger">*</span></label>
          <input id="login-password" class="form-control" name="password" type="password" placeholder="••••••••" required/>
        </div>
        <button class="btn-auth" id="btn-login-submit">Đăng nhập tài khoản</button>
      </form>

      <form id="register-form" style="display:none;">
        <div class="mb-3">
          <label class="form-label fw-semibold small text-muted mb-1">Tên đăng nhập <span class="text-danger">*</span></label>
          <input id="reg-username" class="form-control" name="username" placeholder="nguyenvana" required/>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold small text-muted mb-1">Email <span class="text-danger">*</span></label>
          <input id="reg-email" class="form-control" name="email" type="email" placeholder="example@gmail.com" required/>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold small text-muted mb-1">Mật khẩu <span class="text-danger">*</span></label>
          <input id="reg-password" class="form-control" name="password" type="password" placeholder="••••••••" required/>
        </div>
        <button class="btn-auth" id="btn-reg-submit" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16,185,129,.3);">Đăng ký tài khoản</button>
      </form>
    </div>
    
    <div id="auth-msg" class="mt-4"></div>
  `;

  // Tab switching logic
  const tabs = root.querySelectorAll('#authTabs a');
  tabs.forEach(tab => tab.addEventListener('click', (e) => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tname = tab.dataset.tab;
    root.querySelector('#login-form').style.display = tname === 'login' ? 'block' : 'none';
    root.querySelector('#register-form').style.display = tname === 'register' ? 'block' : 'none';
    
    // update header description based on tab
    const headerTitle = document.querySelector('.auth-header h3');
    const headerDesc = document.querySelector('.auth-header p');
    if (headerTitle && headerDesc) {
        if (tname === 'login') {
            headerTitle.textContent = 'Chào mừng trở lại! 👋';
            headerDesc.textContent = 'Đăng nhập để quản lý giỏ hàng và đơn hàng.';
        } else {
            headerTitle.textContent = 'Tạo tài khoản mới 🚀';
            headerDesc.textContent = 'Gia nhập cộng đồng yêu sách của chúng tôi.';
        }
    }
  }));

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const msg = document.getElementById('auth-msg');

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');

    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';

    try {
      await login({ email, password });
      showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => { window.location.href = '/profile.html'; }, 1000);
    } catch (err) {
      console.error(err);
      msg.innerHTML = `<div class="alert alert-danger px-3 py-2 rounded-3 fs-6">❌ ${err.message || 'Tài khoản hoặc mật khẩu không chính xác'}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập tài khoản';
    }
  });

  // Register handler
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('btn-reg-submit');

    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
      await register({ username, email, password });
      showToast('Đăng ký thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => { window.location.href = '/profile.html'; }, 1000);
    } catch (err) {
      console.error(err);
      msg.innerHTML = `<div class="alert alert-danger px-3 py-2 rounded-3 fs-6">❌ ${err.message || 'Đăng ký thất bại'}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng ký tài khoản';
    }
  });

});
