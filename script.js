const API_URL = 'http://127.0.0.1:3000';

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const feedbackEl = document.getElementById('feedback');

if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

function showFeedback(message, type = 'success') {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback show ${type}`;
}

function clearFeedback() {
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
}

function switchTab(mode) {
  clearFeedback();
  const isLogin = mode === 'login';

  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('active', isLogin);
  registerForm.classList.toggle('active', !isLogin);
}

tabLogin.addEventListener('click', () => switchTab('login'));
tabRegister.addEventListener('click', () => switchTab('register'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFeedback();

  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const btn = document.getElementById('btnLogin');

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const res = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || data.mensagem || 'E-mail ou senha inválidos.');
    }

    localStorage.setItem('token', data.token);
    showFeedback('Login efetuado com sucesso! Redirecionando...', 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 500);
  } catch (err) {
    showFeedback(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFeedback();

  const nome = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value;
  const btn = document.getElementById('btnRegister');

  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    const res = await fetch(`${API_URL}/usuarios/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || data.mensagem || 'Não foi possível concluir o cadastro.');
    }

    showFeedback('Conta criada com sucesso! Agora faça login.', 'success');
    registerForm.reset();
    switchTab('login');
    document.getElementById('loginEmail').value = email;
  } catch (err) {
    showFeedback(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar';
  }
});