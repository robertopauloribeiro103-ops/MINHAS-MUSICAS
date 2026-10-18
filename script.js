// Estado global
let songs = JSON.parse(localStorage.getItem('meuMusic_songs') || '[]');
let currentSongIndex = -1;
const audio = document.getElementById('audio-player');

// Elementos
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const uploadForm = document.getElementById('upload-form');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const shareContainer = document.getElementById('share-link-container');
const shareLinkInput = document.getElementById('share-link');
const copyBtn = document.getElementById('copy-link');

// Navegação
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(link.dataset.section).classList.add('active');
        shareContainer.classList.add('hidden');
    });
});

// Formulário de Envio
uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('song-name').value.trim();
    const artist = document.getElementById('song-artist').value.trim();
    const album = document.getElementById('song-album').value.trim() || 'Sem álbum';
    const file = document.getElementById('song-file').files[0];
    const coverFile = document.getElementById('song-cover').files[0];

    if (!file) return alert('Selecione o arquivo de áudio!');

    // Ler arquivos como URL
    const audioUrl = URL.createObjectURL(file);
    let coverUrl = '';
    if (coverFile) coverUrl = URL.createObjectURL(coverFile);

    const song = {
        id: Date.now(),
        name,
        artist,
        album,
        audioUrl,
        coverUrl: coverUrl || 'https://via.placeholder.com/45/1a1a1a/ffffff?text=♪',
        date: new Date().toISOString()
    };

    songs.unshift(song);
    saveSongs();
    renderSongs();

    // Gerar link compartilhável (simulado — contém o ID)
    const shareUrl = `${window.location.origin}${window.location.pathname}?play=${song.id}`;
    shareLinkInput.value = shareUrl;
    shareContainer.classList.remove('hidden');
    uploadForm.reset();
});

// Copiar link
copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(shareLinkInput.value);
    copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => copyBtn.textContent = '📋 Copiar', 2000);
});

// Salvar no localStorage
function saveSongs() {
    localStorage.setItem('meuMusic_songs', JSON.stringify(songs));
}

// Renderizar listas
function renderSongs() {
    const libraryList = document.getElementById('library-list');
    const recentList = document.getElementById('recent-list');
    const emptyMsg = document.getElementById('empty-msg');

    libraryList.innerHTML = '';
    recentList.innerHTML = '';

    if (songs.length === 0) {
        emptyMsg.classList.remove('hidden');
        return;
    }
    emptyMsg.classList.add('hidden');

    songs.forEach((song, idx) => {
        const el = createSongElement(song, idx);
        libraryList.appendChild(el);
        if (idx < 5) recentList.appendChild(el.cloneNode(true));
    });

    // Reanexar eventos após clonagem
    attachSongEvents();
}

function createSongElement(song, index) {
    const div = document.createElement('div');
    div.className = 'song-item';
    div.dataset.index = index;
    div.innerHTML = `
        <img src="${song.coverUrl}" alt="${song.name}" class="song-cover">
        <div class="song-info">
            <div class="song-title">${escapeHtml(song.name)}</div>
            <div class="song-artist">${escapeHtml(song.artist)} — ${escapeHtml(song.album)}</div>
        </div>
        <div class="song-actions">
            <button class="action-btn share-btn" data-id="${song.id}" title="Compartilhar">🔗</button>
            <button class="action-btn delete-btn" data-index="${index}" title="Excluir">🗑</button>
        </div>
    `;
    return div;
}

function attachSongEvents() {
    document.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', e => {
            if (e.target.closest('.action-btn')) return;
            playSong(parseInt(item.dataset.index));
        });
    });

    // Botões de compartilhar
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const song = songs.find(s => s.id === parseInt(btn.dataset.id));
            if (!song) return;
            const shareUrl = `${window.location.origin}${window.location.pathname}?play=${song.id}`;
            navigator.clipboard.writeText(shareUrl);
            alert('Link copiado! 🎵\n' + shareUrl);
        });
    });

    // Botões de excluir
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (!confirm('Excluir essa música?')) return;
            songs.splice(parseInt(btn.dataset.index), 1);
            saveSongs();
            renderSongs();
            if (currentSongIndex >= songs.length) resetPlayer();
        });
    });
}

// Reprodução
function playSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    audio.src = song.audioUrl;
    audio.play();
    updatePlayerUI(song);
}

function updatePlayerUI(song) {
    document.getElementById('player-title').textContent = song.name;
    document.getElementById('player-artist').textContent = song.artist;
    const coverImg = document.getElementById('player-cover');
    if (song.coverUrl) {
        coverImg.src = song.coverUrl;
        coverImg.classList.remove('hidden');
    }
    playBtn.textContent = '⏸';
}

function resetPlayer() {
    audio.pause();
    audio.src = '';
    document.getElementById('player-title').textContent = 'Nenhuma música selecionada';
    document.getElementById('player-artist').textContent = '—';
    document.getElementById('player-cover').classList.add('hidden');
    playBtn.textContent = '▶';
    progressBar.value = 0;
    currentSongIndex = -1;
}

// Controles
playBtn.addEventListener('click', () => {
    if (currentSongIndex === -1 && songs.length > 0) playSong(0);
    else if (audio.paused) { audio.play(); playBtn.textContent = '⏸'; }
    else { audio.pause(); playBtn.textContent = '▶'; }
});

prevBtn.addEventListener('click', () => {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
});

nextBtn.addEventListener('click', () => {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
});

// Barra de progresso
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    document.getElementById('time-current').textContent = formatTime(audio.currentTime);
    document.getElementById('time-total').textContent = formatTime(audio.duration);
});

progressBar.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

audio.addEventListener('ended', () => nextBtn.click());

// Volume
volumeBar.addEventListener('input', () => audio.volume = volumeBar.value / 100);

// Formatar tempo
function formatTime(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar música pela URL (compartilhada)
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (playId && songs.length > 0) {
        const idx = songs.findIndex(s => s.id === parseInt(playId));
        if (idx !== -1) {
            setTimeout(() => {
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById('library').classList.add('active');
                navLinks.forEach(l => l.classList.remove('active'));
                document.querySelector('[data-section="library"]').classList.add('active');
            }, 100);
        }
    }
}

// Inicializar
renderSongs();
attachSongEvents();
loadFromUrl();
audio.volume = 0.8;