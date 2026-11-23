const API_URL = 'http://127.0.0.1:3000';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const dashFeedback = document.getElementById('dashFeedback');
const musicListEl = document.getElementById('musicList');
const deezerResultsEl = document.getElementById('deezerResults');
const searchInput = document.getElementById('searchInput');
const yearFilter = document.getElementById('yearFilter');

let allMusicas = [];

function showFeedback(message, type = 'success') {
  dashFeedback.textContent = message;
  dashFeedback.className = `feedback show ${type}`;
}

function handleUnauthorized(status) {
  if (status === 401 || status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
    return true;
  }
  return false;
}

function escapeHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function loadMusicas() {
  musicListEl.innerHTML = '<p class="empty-hint">Carregando músicas...</p>';

  try {
    const res = await fetch(`${API_URL}/musicas`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.erro || 'Erro ao buscar músicas.');
    }

    allMusicas = Array.isArray(data) ? data : (data.musicas || []);
    renderMusicas();
  } catch (err) {
    musicListEl.innerHTML = `<p class="empty-hint error-text">${escapeHtml(err.message)}</p>`;
  }
}

function renderMusicas() {
  const termo = searchInput.value.trim().toLowerCase();
  const ano = yearFilter.value.trim();

  const filtradas = allMusicas.filter((m) => {
    const titulo = (m.titulo || m.title || '').toLowerCase();
    const artista = (m.artista || m.artist?.name || m.artist || '').toLowerCase();
    const matchTexto = !termo || titulo.includes(termo) || artista.includes(termo);
    const matchAno = !ano || String(m.ano || m.year || '') === ano;
    return matchTexto && matchAno;
  });

  if (filtradas.length === 0) {
    musicListEl.innerHTML = '<p class="empty-hint">Nenhuma música encontrada com esses filtros.</p>';
    return;
  }

  musicListEl.innerHTML = filtradas.map((musica) => {
    const titulo = escapeHtml(musica.titulo || musica.title || 'Sem título');
    const artista = escapeHtml(
      typeof musica.artista === 'object' ? musica.artista.name : (musica.artista || musica.artist || 'Artista desconhecido')
    );
    const album = escapeHtml(musica.album || musica.album?.title || '—');
    const anoMusica = escapeHtml(musica.ano || musica.year || '—');

    return `
      <div class="music-card">
        <h3>${titulo}</h3>
        <p class="artist">${artista}</p>
        <div class="meta">
          <span>Álbum: ${album}</span>
          <span>Ano: ${anoMusica}</span>
        </div>
      </div>
    `;
  }).join('');
}

searchInput.addEventListener('input', renderMusicas);
yearFilter.addEventListener('input', renderMusicas);

document.getElementById('btnClearFilters').addEventListener('click', () => {
  searchInput.value = '';
  yearFilter.value = '';
  renderMusicas();
});

document.getElementById('addMusicForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const artista = document.getElementById('artista').value.trim();
  const album = document.getElementById('album').value.trim();
  const anoVal = document.getElementById('ano').value.trim();
  const btn = document.getElementById('btnAddMusic');

  const payload = { titulo, artista };
  if (album) payload.album = album;
  if (anoVal) payload.ano = Number(anoVal);

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await fetch(`${API_URL}/musicas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (handleUnauthorized(res.status)) return;

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || data.mensagem || 'Erro ao adicionar música.');
    }

    showFeedback('Música adicionada ao acervo!', 'success');
    e.target.reset();
    await loadMusicas();
  } catch (err) {
    showFeedback(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar música';
  }
});

document.getElementById('deezerSearchForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const query = document.getElementById('deezerQuery').value.trim();
  if (!query) return;

  const btn = document.getElementById('btnDeezerSearch');
  btn.disabled = true;
  btn.textContent = '...';
  deezerResultsEl.innerHTML = '<p class="empty-hint">Buscando no Deezer...</p>';

  try {
    const res = await fetch(`${API_URL}/deezer/pesquisar/${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.erro || 'Erro ao pesquisar no Deezer.');
    }

    const tracks = Array.isArray(data) ? data : (data.data || data.resultados || data.musicas || []);

    if (tracks.length === 0) {
      deezerResultsEl.innerHTML = '<p class="empty-hint">Nenhuma faixa encontrada.</p>';
      return;
    }

    deezerResultsEl.innerHTML = tracks.slice(0, 6).map((track) => {
      const id = track.id;
      const title = escapeHtml(track.title || track.titulo || 'Sem título');
      const artist = escapeHtml(track.artist?.name || track.artista || 'Desconhecido');

      return `
        <div class="deezer-item">
          <div>
            <strong>${title}</strong>
            <small>${artist}</small>
          </div>
          <button type="button" class="btn-save-deezer" data-id="${escapeHtml(id)}">Salvar</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    deezerResultsEl.innerHTML = `<p class="empty-hint error-text">${escapeHtml(err.message)}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buscar';
  }
});

deezerResultsEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-save-deezer');
  if (!btn) return;

  const trackId = btn.dataset.id;
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await fetch(`${API_URL}/deezer/salvar/${encodeURIComponent(trackId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (handleUnauthorized(res.status)) return;

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || data.mensagem || 'Erro ao salvar faixa do Deezer.');
    }

    showFeedback('Faixa do Deezer salva no acervo!', 'success');
    btn.textContent = 'Salvo';
    await loadMusicas();
  } catch (err) {
    showFeedback(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

loadMusicas();