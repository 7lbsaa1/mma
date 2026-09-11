// ================= العناصر =================
const audio        = document.getElementById('audio');
const songsGrid    = document.getElementById('songsGrid');
const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const searchRes    = document.getElementById('searchResults');
const noResults    = document.getElementById('noResults');
const songPage     = document.getElementById('songPage');
const player       = document.getElementById('player');

let current = 0;
let shuffle = false;
let repeat  = false;
let liked   = new Set(JSON.parse(localStorage.getItem('liked') || '[]'));

// ================= عرض الأغاني =================
function renderSongs(list) {
    songsGrid.innerHTML = '';
    list.forEach(song => {
        const idx = songs.indexOf(song);
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="cover">
                <img src="${song.cover}" alt="${song.title}">
                <button class="card-play" data-i="${idx}"><i class="fas fa-play"></i></button>
            </div>
            <h3>${song.title}</h3>
            <p>${song.artist}</p>`;
        card.addEventListener('click', () => openSongPage(idx));
        card.querySelector('.card-play').addEventListener('click', e => {
            e.stopPropagation();
            openSongPage(idx);
            playSong(idx);
        });
        songsGrid.appendChild(card);
    });
    noResults.classList.toggle('hidden', list.length > 0);
    document.getElementById('songCount').textContent = `${list.length} أغنية`;
}

// ================= 🔍 البحث الفعّال =================
function doSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { searchRes.classList.add('hidden'); renderSongs(songs); return; }

    const results = songs.filter(s =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
    renderSongs(results);

    // نتائج منسدلة فورية أثناء الكتابة
    if (results.length) {
        searchRes.innerHTML = results.map(s => `
            <div class="result-item" data-id="${s.id}">
                <img src="${s.cover}" alt="">
                <div><strong>${s.title}</strong><br><small style="color:var(--muted)">${s.artist}</small></div>
            </div>`).join('');
        searchRes.classList.remove('hidden');
        searchRes.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                openSongPage(songs.findIndex(s => s.id == item.dataset.id));
                searchRes.classList.add('hidden');
            });
        });
    } else {
        searchRes.classList.add('hidden');
    }
}
searchInput.addEventListener('input', doSearch);          // فوري أثناء الكتابة
searchInput.addEventListener('keyup', e => e.key === 'Enter' && doSearch());
searchBtn.addEventListener('click', doSearch);
document.addEventListener('click', e => {
    if (!e.target.closest('.search-box') && !e.target.closest('.search-results'))
        searchRes.classList.add('hidden');
});

// ================= صفحة الأغنية الكاملة =================
function openSongPage(i) {
    const s = songs[i];
    current = i;
    document.getElementById('pageCover').src  = s.cover;
    document.getElementById('pageTitle').textContent  = s.title;
    document.getElementById('pageArtist').textContent = s.artist;
    const dl = document.getElementById('downloadBtn');
    dl.href = s.src;
    dl.setAttribute('download', `${s.title} - ${s.artist}.m4a`);   // ⬇️ زر التحميل
    document.getElementById('lyricsBox').textContent = s.lyrics;
    document.getElementById('lyricsBox').classList.add('hidden');
    songPage.classList.remove('hidden');
    updatePlayerUI();
}
document.getElementById('closePageBtn').addEventListener('click', () => songPage.classList.add('hidden'));

// 📜 إظهار/إخفاء الكلمات
document.getElementById('lyricsBtn').addEventListener('click', () => {
    const box = document.getElementById('lyricsBox');
    const hidden = box.classList.toggle('hidden');
    document.getElementById('lyricsBtn').innerHTML = hidden
        ? '<i class="fas fa-align-right"></i> إظهار الكلمات'
        : '<i class="fas fa-eye-slash"></i> إخفاء الكلمات';
});

// ================= ▶️ تشغيل / إيقاف =================
function playSong(i) {
    current = i;
    audio.src = songs[i].src;
    audio.play().then(updatePlayerUI).catch(console.warn);
    player.classList.remove('hidden');
    updatePlayerUI();
}
function togglePlay() {
    audio.paused ? audio.play() : audio.pause();
    player.classList.remove('hidden');
    updatePlayerUI();
}
document.getElementById('playBtn').addEventListener('click', togglePlay);
document.getElementById('pagePlayBtn').addEventListener('click', () => {
    if (audio.paused) { playSong(current); } else { audio.pause(); updatePlayerUI(); }
});

audio.addEventListener('play',  updatePlayerUI);
audio.addEventListener('pause', updatePlayerUI);

function updatePlayerUI() {
    const playing = !audio.paused;
    const icon = playing ? 'fa-pause' : 'fa-play';
    document.getElementById('playBtn').innerHTML       = `<i class="fas ${icon}"></i>`;
    document.getElementById('pagePlayBtn').innerHTML   = `<i class="fas ${icon}"></i> ${playing ? 'إيقاف مؤقت' : 'تشغيل'}`;
    document.querySelector('.player-track').classList.toggle('playing', playing);
    document.getElementById('playerCover').src  = songs[current].cover;
    document.getElementById('playerTitle').textContent  = songs[current].title;
    document.getElementById('playerArtist').textContent = songs[current].artist;
}

// ================= ⏭️ التالي / السابق / عشوائي / تكرار =================
function nextSong() {
    let n;
    if (shuffle) {
        do { n = Math.floor(Math.random() * songs.length); } while (n === current && songs.length > 1);
    } else {
        n = (current + 1) % songs.length;
    }
    playSong(n);
}
function prevSong() {
    playSong((current - 1 + songs.length) % songs.length);
}
document.getElementById('nextBtn').addEventListener('click', nextSong);
document.getElementById('prevBtn').addEventListener('click', prevSong);

// 🔄 عند انتهاء الأغنية → التالية تلقائياً
audio.addEventListener('ended', () => {
    if (repeat) { audio.currentTime = 0; audio.play(); }
    else nextSong();
});

// 🔀 زر العشوائي
document.getElementById('shuffleBtn').addEventListener('click', function () {
    shuffle = !shuffle;
    this.classList.toggle('on', shuffle);
});
// 🔁 زر التكرار
document.getElementById('repeatBtn').addEventListener('click', function () {
    repeat = !repeat;
    this.classList.toggle('on', repeat);
});

// ================= ⏱️ شريط المؤقت الحقيقي =================
const progressWrap = document.getElementById('progressWrap');
const fill  = document.getElementById('progressFill');
const thumb = document.getElementById('progressThumb');

function fmt(t) {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}
audio.addEventListener('loadedmetadata', () => document.getElementById('duration').textContent = fmt(audio.duration));
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const p = (audio.currentTime / audio.duration) * 100;
    fill.style.width = p + '%';
    thumb.style.right = p + '%';
    document.getElementById('current').textContent = fmt(audio.currentTime);
});

// السحب/النقر للتنقّل داخل الأغنية
function seek(e) {
    const r = progressWrap.getBoundingClientRect();
    // RTL: النسبة من اليمين
    let p = (r.right - e.clientX) / r.width;
    p = Math.max(0, Math.min(1, p));
    if (audio.duration) {
        audio.currentTime = p * audio.duration;
        fill.style.width = (p * 100) + '%';
        thumb.style.right = (p * 100) + '%';
    }
}
let dragging = false;
progressWrap.addEventListener('mousedown', e => { dragging = true; seek(e); });
window.addEventListener('mousemove', e => dragging && seek(e));
window.addEventListener('mouseup', () => dragging = false);
progressWrap.addEventListener('touchmove', e => seek(e.touches[0]), { passive: true });

// ================= 🔊 الصوت =================
const vol = document.getElementById('volumeSlider');
audio.volume = vol.value / 100;
vol.addEventListener('input', () => audio.volume = vol.value / 100);

// ================= ❤️ المفضلة =================
const likeBtn = document.getElementById('likeBtn');
likeBtn.addEventListener('click', () => {
    const id = songs[current].id;
    liked.has(id) ? liked.delete(id) : liked.add(id);
    localStorage.setItem('liked', JSON.stringify([...liked]));
    refreshLike();
});
function refreshLike() {
    const isLiked = liked.has(songs[current]?.id);
    likeBtn.innerHTML = `<i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>`;
    likeBtn.classList.toggle('liked', isLiked);
}
setInterval(refreshLike, 500);

// ================= الفنانين =================
function renderArtists() {
    const names = [...new Set(songs.map(s => s.artist))];
    document.getElementById('artistsGrid').innerHTML = names.map(n => `
        <div class="artist-card">
            <div class="avatar">${n[0]}</div>
            <h3>${n}</h3>
            <p style="color:var(--muted);font-size:13px">${songs.filter(s=>s.artist===n).length} أغاني</p>
        </div>`).join('');
}

// ================= تهيئة =================
renderSongs(songs);
renderArtists();
