// Auth page logic (login/register)
import { login, register } from '../api.js';

console.log('auth.js loaded');
document.addEventListener('DOMContentLoaded', ()=>{
  const root = document.getElementById('auth-root');
  if (!root) return;

  root.innerHTML = `
    <div id="auth-area">
      <ul class="nav nav-tabs mb-3" id="authTabs"><li class="nav-item"><a class="nav-link active" href="#" data-tab="login">Đăng nhập</a></li><li class="nav-item"><a class="nav-link" href="#" data-tab="register">Đăng ký</a></li></ul>
      <div id="auth-forms">
        <form id="login-form">
          <div class="mb-3"><input id="login-email" class="form-control" name="email" placeholder="Email" required/></div>
          <div class="mb-3"><input id="login-password" class="form-control" name="password" type="password" placeholder="Mật khẩu" required/></div>
          <button class="btn btn-primary">Đăng nhập</button>
        </form>

        <form id="register-form" style="display:none;">
          <div class="mb-3"><input id="reg-username" class="form-control" name="username" placeholder="Tên đăng nhập" required/></div>
          <div class="mb-3"><input id="reg-email" class="form-control" name="email" placeholder="Email" required/></div>
          <div class="mb-3"><input id="reg-password" class="form-control" name="password" type="password" placeholder="Mật khẩu" required/></div>
          <button class="btn btn-success">Đăng ký</button>
        </form>
      </div>
      <div id="auth-msg" class="mt-3"></div>
    </div>
  `;

  const tabs = root.querySelectorAll('#authTabs a');
  tabs.forEach(tab => tab.addEventListener('click', (e)=>{
    e.preventDefault();
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const tname = tab.dataset.tab;
    root.querySelector('#login-form').style.display = tname==='login' ? '' : 'none';
    root.querySelector('#register-form').style.display = tname==='register' ? '' : 'none';
  }));

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const msg = document.getElementById('auth-msg');

  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    msg.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try{
      await login({ email, password });
      window.location.href = '/profile.html';
    }catch(err){
      console.error(err);
      msg.innerHTML = `<div class="alert alert-danger">${err.message || 'Đăng nhập thất bại'}</div>`;
    }
  });

  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    msg.textContent = '';
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    try{
      await register({ username, email, password });
      window.location.href = '/profile.html';
    }catch(err){
      console.error(err);
      msg.innerHTML = `<div class="alert alert-danger">${err.message || 'Đăng ký thất bại'}</div>`;
    }
  });

});
