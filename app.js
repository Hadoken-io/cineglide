// ══════════════════════════════════════════════
// CONFIG  —  paste your TMDB key below
// ══════════════════════════════════════════════
const API_KEY = 'e7d0b064f708f267ed29a6f92cbd728f';
const BASE    = 'https://api.tmdb.org/3';           // use this domain (avoids ISP blocks)
const IMG     = 'https://image.tmdb.org/t/p/w500';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let movieQueue         = [];
let currentIndex       = 0;
let currentType        = 'movie';
let currentPage        = 1;
let homeGenres         = [];
let ageFilter          = 'all';
let cookAgeFilter      = 'all';
let cookType           = 'movie';
let selectedCookGenres = [];
let currentCard        = null;
let modalCurrent       = null;
let savedList          = JSON.parse(localStorage.getItem('CineGlide_saved') || '[]');

// Picker state
let pickerSelectedType = 'movie';
let pickerSelected     = [];

// ══════════════════════════════════════════════
// GENRE DATA
// ══════════════════════════════════════════════
const GENRES = {
  movie: [
    {id:28,   name:'Action',    icon:'💥'},
    {id:35,   name:'Comedy',    icon:'😂'},
    {id:18,   name:'Drama',     icon:'🎭'},
    {id:27,   name:'Horror',    icon:'👻'},
    {id:878,  name:'Sci-Fi',    icon:'🚀'},
    {id:10749,name:'Romance',   icon:'💕'},
    {id:53,   name:'Thriller',  icon:'😱'},
    {id:16,   name:'Animation', icon:'🎨'},
    {id:80,   name:'Crime',     icon:'🕵️'},
    {id:14,   name:'Fantasy',   icon:'🧙'},
    {id:36,   name:'History',   icon:'📜'},
    {id:10402,name:'Music',     icon:'🎵'},
  ],
  tv: [
    {id:10759,name:'Action',     icon:'💥'},
    {id:35,   name:'Comedy',     icon:'😂'},
    {id:18,   name:'Drama',      icon:'🎭'},
    {id:9648, name:'Mystery',    icon:'🔍'},
    {id:10765,name:'Sci-Fi',     icon:'🚀'},
    {id:10749,name:'Romance',    icon:'💕'},
    {id:80,   name:'Crime',      icon:'🕵️'},
    {id:16,   name:'Animation',  icon:'🎨'},
    {id:99,   name:'Documentary',icon:'🎞'},
    {id:10762,name:'Kids',       icon:'🧒'},
    {id:10764,name:'Reality',    icon:'📺'},
    {id:10767,name:'Talk',       icon:'🎤'},
  ]
};

// ══════════════════════════════════════════════
// GENRE PICKER (shown on first load)
// ══════════════════════════════════════════════
function showGenrePicker() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="genre-picker-overlay" id="genre-overlay">
      <div class="genre-picker-box">
        <p class="picker-logo">CineGlide</p>
        <h1 class="picker-title">What do you<br/>love watching?</h1>
        <p class="picker-sub">Pick your favourite genres — we'll build your personal feed. You can change this anytime.</p>

        <div class="picker-toggle">
          <button class="picker-type active" id="pick-movie" onclick="pickerSwitchType('movie')">🎬 Movies</button>
          <button class="picker-type" id="pick-tv" onclick="pickerSwitchType('tv')">📺 Shows</button>
        </div>

        <div class="picker-grid" id="picker-grid"></div>

        <div class="picker-age-block">
          <p class="picker-age-label">CONTENT RATING</p>
          <div class="picker-age-row">
            <button class="picker-age-btn active" id="picker-age-all" onclick="setPickerAge('all')">👶 All Ages</button>
            <button class="picker-age-btn" id="picker-age-18" onclick="setPickerAge('18+')">🔞 18+ Only</button>
          </div>
        </div>

        <button class="picker-go" onclick="startApp()">Start Swiping →</button>
      </div>
    </div>
  `);
  renderPickerGrid('movie');
}

function pickerSwitchType(type) {
  pickerSelectedType = type;
  pickerSelected     = [];
  document.getElementById('pick-movie').classList.toggle('active', type === 'movie');
  document.getElementById('pick-tv').classList.toggle('active',   type === 'tv');
  renderPickerGrid(type);
}

function renderPickerGrid(type) {
  const grid = document.getElementById('picker-grid');
  grid.innerHTML = '';
  GENRES[type].forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'picker-tile' + (pickerSelected.includes(g.id) ? ' selected' : '');
    btn.innerHTML = `<span>${g.icon}</span>${g.name}`;
    btn.onclick = () => {
      if (pickerSelected.includes(g.id)) {
        pickerSelected = pickerSelected.filter(x => x !== g.id);
      } else {
        pickerSelected.push(g.id);
      }
      renderPickerGrid(type);
    };
    grid.appendChild(btn);
  });
}

function setPickerAge(val) {
  ageFilter = val;
  document.getElementById('picker-age-all').classList.toggle('active', val === 'all');
  document.getElementById('picker-age-18').classList.toggle('active',  val === '18+');
}

async function startApp() {
  homeGenres  = [...pickerSelected];
  currentType = pickerSelectedType;

  // Sync home toggle
  document.getElementById('btn-movie').classList.toggle('active', currentType === 'movie');
  document.getElementById('btn-tv').classList.toggle('active',    currentType === 'tv');

  // Animate overlay out
  const overlay = document.getElementById('genre-overlay');
  overlay.style.transition = 'opacity 0.3s ease';
  overlay.style.opacity    = '0';
  setTimeout(() => overlay.remove(), 300);

  // Load movies
  showLoading(true);
  hideFlipCard(true);
  movieQueue   = await fetchMovies(currentType, 1, homeGenres);
  currentIndex = 0;
  await loadNextCard();
}

// ══════════════════════════════════════════════
// AGE FILTER HELPERS
// ══════════════════════════════════════════════
function getAgeParams(filter) {
  if (filter === '18+') return '&include_adult=true';
  return '&include_adult=false';
}

function setCookAge(val) {
  cookAgeFilter = val;
  document.getElementById('cook-age-all').classList.toggle('active', val === 'all');
  document.getElementById('cook-age-18').classList.toggle('active',  val === '18+');
}

// ══════════════════════════════════════════════
// FETCH MOVIES FROM TMDB
// ══════════════════════════════════════════════
async function fetchMovies(type = 'movie', page = 1, genreIds = [], ageOverride = null) {
  try {
    const endpoint   = type === 'movie' ? 'discover/movie' : 'discover/tv';
    const genreParam = genreIds.length ? `&with_genres=${genreIds.join(',')}` : '';
    const age        = getAgeParams(ageOverride !== null ? ageOverride : ageFilter);
    const url        = `${BASE}/${endpoint}?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc&vote_count.gte=50${genreParam}${age}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (data.status_message) {
      console.error('TMDB Error:', data.status_message);
      alert('API Error: ' + data.status_message + '\n\nCheck your API key in app.js line 4');
      return [];
    }
    return data.results || [];
  } catch (err) {
    console.error('Fetch failed:', err);
    return [];
  }
}

async function fetchStreamingProviders(id, type) {
  const el = document.getElementById('stream-pills');
  el.innerHTML = '<span class="stream-pill">Checking…</span>';
  try {
    const ep   = type === 'movie' ? 'movie' : 'tv';
    const res  = await fetch(`${BASE}/${ep}/${id}/watch/providers?api_key=${API_KEY}`);
    const data = await res.json();
    const region = data.results?.IN || data.results?.US || null;
    const flat   = region?.flatrate || [];
    el.innerHTML = '';
    if (flat.length === 0) {
      el.innerHTML = '<span class="stream-pill">Not streaming</span>';
    } else {
      flat.slice(0, 4).forEach(p => {
        const span = document.createElement('span');
        span.className   = 'stream-pill';
        span.textContent = p.provider_name;
        el.appendChild(span);
      });
    }
  } catch {
    el.innerHTML = '<span class="stream-pill">Unavailable</span>';
  }
}

// ══════════════════════════════════════════════
// LOAD NEXT CARD
// ══════════════════════════════════════════════
async function loadNextCard() {
  showLoading(true);
  hideFlipCard(true);

  // Refill queue when running low
  if (currentIndex >= movieQueue.length - 2) {
    currentPage++;
    const more = await fetchMovies(currentType, currentPage, homeGenres);
    movieQueue = [...movieQueue, ...more];
  }

  const item = movieQueue[currentIndex];
  if (!item) { showLoading(false); return; }

  currentCard  = item;
  currentIndex++;

  const poster = item.poster_path
    ? IMG + item.poster_path
    : 'https://placehold.co/400x600/edeae4/8c877f?text=No+Image';

  document.getElementById('card-poster').src           = poster;
  document.getElementById('card-poster').alt           = item.title || item.name;
  document.getElementById('card-title').textContent    = item.title || item.name || '—';
  document.getElementById('back-title').textContent    = item.title || item.name || '—';
  document.getElementById('back-synopsis').textContent = item.overview || 'No synopsis available.';
  document.getElementById('rating-imdb').textContent   = item.vote_average ? item.vote_average.toFixed(1) : '—';
  document.getElementById('rating-pop').textContent    = item.popularity   ? Math.round(item.popularity)  : '—';

  const dateStr = item.release_date || item.first_air_date || '';
  document.getElementById('rating-year').textContent = dateStr ? dateStr.split('-')[0] : '—';

  // Genre pills
  const typeG   = GENRES[currentType];
  const pillsEl = document.getElementById('card-genres');
  pillsEl.innerHTML = '';
  (item.genre_ids || []).slice(0, 3).forEach(id => {
    const g = typeG.find(x => x.id === id);
    if (g) {
      const span = document.createElement('span');
      span.className   = 'genre-pill';
      span.textContent = g.name;
      pillsEl.appendChild(span);
    }
  });

  fetchStreamingProviders(item.id, currentType);

  // Reset flip state
  document.getElementById('flip-card').classList.remove('flipped');
  showLoading(false);
  hideFlipCard(false);
}

function showLoading(val) {
  document.getElementById('loading-card').style.display = val ? 'flex' : 'none';
}
function hideFlipCard(val) {
  document.getElementById('flip-card').style.display = val ? 'none' : 'block';
}

// ══════════════════════════════════════════════
// SWIPE / DRAG LOGIC
// ══════════════════════════════════════════════
let startX = 0, startY = 0, isDragging = false;

const cardEl  = () => document.getElementById('flip-card');
const stackEl = document.getElementById('card-stack');

// Mouse events
stackEl.addEventListener('mousedown', e => {
  startX = e.clientX; startY = e.clientY; isDragging = false;
});
stackEl.addEventListener('mousemove', e => {
  if (!e.buttons) return;
  isDragging = true;
  dragCard(e.clientX - startX, e.clientY - startY);
});
stackEl.addEventListener('mouseup', e => {
  endDrag(e.clientX - startX, e.clientY - startY);
});

// Touch events
stackEl.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isDragging = false;
}, {passive: true});
stackEl.addEventListener('touchmove', e => {
  isDragging = true;
  dragCard(e.touches[0].clientX - startX, e.touches[0].clientY - startY);
}, {passive: true});
stackEl.addEventListener('touchend', e => {
  endDrag(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY);
});

function dragCard(dx, dy) {
  const c = cardEl(); if (!c) return;
  c.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.07}deg)`;
  document.getElementById('lbl-skip').style.opacity   = dx < -30 ? Math.min(1, (-dx - 30) / 80) : 0;
  document.getElementById('lbl-save').style.opacity   = dx >  30 ? Math.min(1,  (dx - 30) / 80) : 0;
  document.getElementById('lbl-search').style.opacity = dy < -30 ? Math.min(1, (-dy - 30) / 80) : 0;
}

function endDrag(dx, dy) {
  // Hide labels
  ['lbl-skip','lbl-save','lbl-search'].forEach(id => {
    document.getElementById(id).style.opacity = 0;
  });

  const c = cardEl(); if (!c) return;

  // Tap = flip card
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && !isDragging) {
    c.style.transform = '';
    c.classList.toggle('flipped');
    return;
  }

  // Swipe thresholds
  if (dy < -90 && Math.abs(dx) < 90) { onSwipe('up');    return; }
  if (dx >  90)                       { onSwipe('right'); return; }
  if (dx < -90)                       { onSwipe('left');  return; }

  // Spring back
  c.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)';
  c.style.transform  = '';
  setTimeout(() => { c.style.transition = ''; }, 350);
}

function onSwipe(dir) {
  const c = cardEl(); if (!c) return;
  c.style.transition = 'transform 0.38s ease, opacity 0.38s';

  if (dir === 'right') {
    c.style.transform = 'translateX(130%) rotate(20deg)';
    saveMovie(currentCard);
  } else if (dir === 'left') {
    c.style.transform = 'translateX(-130%) rotate(-20deg)';
  } else if (dir === 'up') {
    c.style.transform = 'translateY(-130%)';
    googleSearch();
  }

  setTimeout(() => {
    c.style.transition = '';
    c.style.transform  = '';
    loadNextCard();
  }, 400);
}

// Button clicks
document.getElementById('btn-skip').onclick   = () => onSwipe('left');
document.getElementById('btn-save').onclick   = () => onSwipe('right');
document.getElementById('btn-google').onclick = () => onSwipe('up');

function googleSearch() {
  if (!currentCard) return;
  const q = encodeURIComponent((currentCard.title || currentCard.name) + ' movie');
  window.open(`https://www.google.com/search?q=${q}`, '_blank');
}

// ══════════════════════════════════════════════
// HOME TYPE SWITCH
// ══════════════════════════════════════════════
async function switchType(type) {
  currentType  = type;
  homeGenres   = [];
  movieQueue   = []; currentIndex = 0; currentPage = 1;
  document.getElementById('btn-movie').classList.toggle('active', type === 'movie');
  document.getElementById('btn-tv').classList.toggle('active',    type === 'tv');
  showLoading(true); hideFlipCard(true);
  movieQueue = await fetchMovies(type, 1, []);
  await loadNextCard();
}

// ══════════════════════════════════════════════
// SAVE / REMOVE
// ══════════════════════════════════════════════
function saveMovie(item) {
  if (!item) return;
  if (!savedList.find(x => x.id === item.id)) {
    savedList.push(item);
    localStorage.setItem('CineGlide_saved', JSON.stringify(savedList));
  }
}
function removeFromSaved() {
  if (!modalCurrent) return;
  savedList = savedList.filter(x => x.id !== modalCurrent.id);
  localStorage.setItem('CineGlide_saved', JSON.stringify(savedList));
  closeModal();
  renderSaved();
}
function googleCurrentModal() {
  if (!modalCurrent) return;
  const q = encodeURIComponent((modalCurrent.title || modalCurrent.name) + ' movie');
  window.open(`https://www.google.com/search?q=${q}`, '_blank');
}

// ══════════════════════════════════════════════
// PAGE NAVIGATION
// ══════════════════════════════════════════════
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-'  + name).classList.add('active');
  if (name === 'saved') renderSaved();
  if (name === 'cook')  renderCookGenres();
}

// ══════════════════════════════════════════════
// SAVED PAGE
// ══════════════════════════════════════════════
function renderSaved() {
  const grid  = document.getElementById('saved-grid');
  const empty = document.getElementById('empty-saved');
  grid.innerHTML = '';

  if (savedList.length === 0) {
    empty.style.display = 'flex';
    grid.style.display  = 'none';
    return;
  }
  empty.style.display = 'none';
  grid.style.display  = 'grid';

  savedList.forEach(item => {
    const tile   = document.createElement('div');
    tile.className = 'saved-tile';
    tile.onclick = () => openModal(item);
    const poster = item.poster_path ? IMG + item.poster_path : '';
    const typeG  = GENRES[item.media_type === 'tv' ? 'tv' : 'movie'];
    const genre  = item.genre_ids ? (typeG.find(x => x.id === item.genre_ids[0])?.name || '') : '';
    tile.innerHTML = `
      <img src="${poster}" alt="${item.title || item.name}" loading="lazy"/>
      <div class="saved-tile-overlay"></div>
      <div class="saved-tile-info">
        <div class="saved-tile-title">${item.title || item.name}</div>
        <div class="saved-tile-genre">${genre}</div>
      </div>`;
    grid.appendChild(tile);
  });
}

async function openModal(item) {
  modalCurrent = item;
  const typeG  = GENRES[item.media_type === 'tv' ? 'tv' : 'movie'];
  document.getElementById('modal-poster').src           = item.poster_path ? IMG + item.poster_path : '';
  document.getElementById('modal-title').textContent    = item.title || item.name;
  document.getElementById('modal-synopsis').textContent = item.overview || '—';

  const gEl = document.getElementById('modal-genres');
  gEl.innerHTML = '';
  (item.genre_ids || []).slice(0, 3).forEach(id => {
    const g = typeG.find(x => x.id === id);
    if (g) {
      const s = document.createElement('span');
      s.className = 'modal-genre-pill';
      s.textContent = g.name;
      gEl.appendChild(s);
    }
  });

  // Show modal first, then load recs
  document.getElementById('modal-bg').classList.add('open');
  loadRecommendations(item);
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  modalCurrent = null;
}

// ══════════════════════════════════════════════
// ML RECOMMENDATIONS
// ══════════════════════════════════════════════
async function loadRecommendations(item) {
  const recSection = document.getElementById('rec-section');
  const recList    = document.getElementById('rec-list');
  recSection.style.display = 'block';
  recList.innerHTML = '<div class="rec-loading"><div class="spinner"></div></div>';

  try {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';

    // Primary: TMDB recommendations (people who liked this also liked…)
    let res  = await fetch(`${BASE}/${type}/${item.id}/recommendations?api_key=${API_KEY}&page=1`);
    let data = await res.json();
    let results = data.results || [];

    // Fallback: similar movies if recommendations empty
    if (results.length === 0) {
      res     = await fetch(`${BASE}/${type}/${item.id}/similar?api_key=${API_KEY}&page=1`);
      data    = await res.json();
      results = data.results || [];
    }

    recList.innerHTML = '';

    if (results.length === 0) {
      recList.innerHTML = '<p class="rec-empty">No recommendations found</p>';
      return;
    }

    results.slice(0, 10).forEach(rec => {
      const card = document.createElement('div');
      card.className = 'rec-card';
      const poster = rec.poster_path
        ? IMG + rec.poster_path
        : 'https://placehold.co/120x180/edeae4/8c877f?text=N/A';
      card.innerHTML = `
        <img class="rec-poster" src="${poster}" alt="${rec.title || rec.name}" loading="lazy"/>
        <div class="rec-info">
          <div class="rec-title">${rec.title || rec.name}</div>
          <div class="rec-rating">⭐ ${rec.vote_average?.toFixed(1) || '—'}</div>
        </div>`;
      // Click rec card: save it and open its own modal
      card.onclick = () => {
        saveMovie(rec);
        openModal(rec);
      };
      recList.appendChild(card);
    });

  } catch (err) {
    recList.innerHTML = '<p class="rec-empty">Could not load recommendations</p>';
    console.error('Recommendations error:', err);
  }
}

// ══════════════════════════════════════════════
// COOK PAGE
// ══════════════════════════════════════════════
function switchCookType(type) {
  cookType = type;
  selectedCookGenres = [];
  document.getElementById('cook-btn-movie').classList.toggle('active', type === 'movie');
  document.getElementById('cook-btn-tv').classList.toggle('active',    type === 'tv');
  renderCookGenres();
  document.getElementById('cook-results').style.display = 'none';
}

function renderCookGenres() {
  const grid = document.getElementById('genre-grid');
  grid.innerHTML = '';
  GENRES[cookType].forEach(g => {
    const tile = document.createElement('button');
    tile.className = 'genre-tile' + (selectedCookGenres.includes(g.id) ? ' selected' : '');
    tile.innerHTML = `<span>${g.icon}</span>${g.name}`;
    tile.onclick   = () => {
      if (selectedCookGenres.includes(g.id)) {
        selectedCookGenres = selectedCookGenres.filter(x => x !== g.id);
      } else {
        selectedCookGenres.push(g.id);
      }
      renderCookGenres();
    };
    grid.appendChild(tile);
  });
}

async function startCookSession() {
  if (selectedCookGenres.length === 0) {
    alert('Pick at least one genre first! 🎬');
    return;
  }
  const results = await fetchMovies(cookType, 1, selectedCookGenres, cookAgeFilter);
  renderCookResults(results);
}

function renderCookResults(items) {
  const list = document.getElementById('cook-list');
  list.innerHTML = '';
  document.getElementById('cook-results').style.display = 'block';

  const typeG = GENRES[cookType];
  items.slice(0, 15).forEach(item => {
    const row = document.createElement('div');
    row.className = 'cook-row';
    const poster = item.poster_path ? IMG + item.poster_path : '';
    const genre  = item.genre_ids
      ? (typeG.find(x => x.id === item.genre_ids[0])?.name || '') : '';
    row.innerHTML = `
      <img src="${poster}" alt="${item.title || item.name}" loading="lazy"/>
      <div class="cook-row-info">
        <div class="cook-row-title">${item.title || item.name}</div>
        <div class="cook-row-genre">${genre}</div>
      </div>
      <div class="cook-row-rating">⭐ ${item.vote_average?.toFixed(1) || '—'}</div>`;
    row.onclick = () => {
      saveMovie(item);
      openModal(item);
    };
    list.appendChild(row);
  });
}

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
showGenrePicker();