const form = document.getElementById('loginForm');
const mensagemEl = document.getElementById('mensagem');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  // Limpa mensagens anteriores
  mensagemEl.className = 'mensagem';
  mensagemEl.textContent = '';

  try {
    const response = await fetch('http://127.0.0.1:3000/usuarios/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || 'Falha ao realizar login');
    }

    // Salva o JWT no localStorage para rotas futuras
    localStorage.setItem('token', data.token);

    mensagemEl.classList.add('sucesso');
    mensagemEl.textContent = 'Login efetuado com sucesso!';

    console.log('Token armazenado:', data.token);

  } catch (error) {
    mensagemEl.classList.add('erro');
    mensagemEl.textContent = error.message;
  }
});