const madeForYou = document.querySelector("#madeForYou");
const queueList = document.querySelector("#queueList");
const playPause = document.querySelector("#playPause");
const sidePlayPause = document.querySelector("#sidePlayPause");
const previous = document.querySelector("#prevTrack");
const next = document.querySelector("#nextTrack");
const sidePrevious = document.querySelector("#sidePrevTrack");
const sideNext = document.querySelector("#sideNextTrack");
const heroPlay = document.querySelector("#heroPlay");
const playerTitle = document.querySelector("#playerTitle");
const playerArtist = document.querySelector("#playerArtist");
const playerCover = document.querySelector("#playerCover");
const sideTitle = document.querySelector("#sideTitle");
const sideArtist = document.querySelector("#sideArtist");
const sideCover = document.querySelector("#sideCover");
const heroCover = document.querySelector("#heroCover");
const favPlayer = document.querySelector("#favPlayer");
const favSide = document.querySelector("#favSide");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const menuItems = document.querySelectorAll(".menu-item");
const playlistItems = document.querySelectorAll(".playlist-item");
const volumeControl = document.querySelector("#volumeControl");
const sideProgressControl = document.querySelector("#sideProgressControl");
const mobileProgressControl = document.querySelector("#mobileProgressControl");
const sideCurrentTime = document.querySelector("#sideCurrentTime");
const sideDurationTime = document.querySelector("#sideDurationTime");
const mobileCurrentTime = document.querySelector("#mobileCurrentTime");
const mobileDurationTime = document.querySelector("#mobileDurationTime");
const shuffleButtons = [document.querySelector("#shuffleTrack"), document.querySelector("#bottomShuffle")];
const repeatButtons = [document.querySelector("#repeatTrack"), document.querySelector("#bottomRepeat")];
const viewTitle = document.querySelector("#viewTitle");
const heroEyebrow = document.querySelector("#heroEyebrow");
const heroText = document.querySelector("#heroText");
const sectionTitle = document.querySelector("#sectionTitle");
const heroVideo = document.querySelector("#heroVideo");
const heroSection = document.querySelector(".hero");
const themeSelect = document.querySelector("#themeSelect");
const rightPanel = document.querySelector(".right-panel");
const playerEl = document.querySelector(".player");
const appEl = document.querySelector(".app");
const visitorTotal = document.querySelector("#visitorTotal");
const visitorActive = document.querySelector("#visitorActive");
const volumeBox = document.querySelector("#volumeBox");
const volumeToggle = document.querySelector("#volumeToggle");
const mobileVolumeBox = document.querySelector("#mobileVolumeBox");
const mobileVolumeToggle = document.querySelector("#mobileVolumeToggle");
const mobileVolumeControl = document.querySelector("#mobileVolumeControl");

const API_BASE = window.location.origin;
const FAVORITES_KEY = "camadaplay:favoritos_v2";
const HISTORY_KEY = "camadaplay:historico_v2";
const SEARCH_HISTORY_KEY = "camadaplay:pesquisas_v1";
const THEME_KEY = "camadaplay:theme_v1";
const VISITOR_ID_KEY = "camadaplay:visitor_id_v1";
const VOLUME_KEY = "camadaplay:volume_v1";
const PLAYLISTS_KEY = "camadaplay:playlists_v1";
const DEFAULT_VOLUME = 100;
const COVER_CLASSES = ["cover-one", "cover-two", "cover-three", "cover-four"];
const THEMES = new Set(["default", "anos80", "anya-forger", "ashley-graves", "asta", "coco-atelier", "cyberpunk", "demon-slayer", "frieren", "goku", "hacker", "hello-kitty", "hello-kitty-kuromi", "hello-kitty-my-melody", "japao", "kaguya-sama", "komi-san", "megumin-konosuba", "meliodas", "naruto", "rikka-takanashi", "sakura", "solo-leveling", "sono-bisque-doll", "suzuki", "vanellope"]);
const CATEGORY_KEYWORDS = [
    { name: "funk brasileiro", terms: ["funk", "funk brasileiro", "mc ", "dj ", "mandela", "automotivo", "tamborzao", "brega funk"] },
    { name: "sertanejo", terms: ["sertanejo", "arrocha", "modao", "sofrencia", "ana castela", "gusttavo lima", "luan santana", "henrique", "juliano", "jorge e mateus"] },
    { name: "trap", terms: ["trap", "travis scott", "future", "playboi carti", "lil ", "matuê", "matue", "teto", "wiu"] },
    { name: "rap hip hop", terms: ["rap", "hip hop", "racionais", "emicida", "kendrick", "drake", "kanye", "sabota", "bk'", "djonga"] },
    { name: "pop", terms: ["pop", "billie eilish", "billie elish", "taylor swift", "dua lipa", "ariana grande", "bruno mars", "maroon 5", "the weeknd"] },
    { name: "rock", terms: ["rock", "metal", "linkin park", "nirvana", "foo fighters", "arctic monkeys", "system of a down", "queen"] },
    { name: "eletrônica", terms: ["eletrônica", "eletronica", "electronic", "edm", "house", "techno", "phonk", "alan walker", "calvin harris", "marshmello"] },
    { name: "k-pop", terms: ["k-pop", "kpop", "bts", "blackpink", "stray kids", "newjeans", "twice"] },
    { name: "anime", terms: ["anime", "opening", "ost", "j-pop", "jpop", "naruto", "demon slayer", "kimetsu", "one piece", "jujutsu"] },
    { name: "mpb", terms: ["mpb", "bossa nova", "tom jobim", "caetano", "gilberto gil", "chico buarque", "liniker", "seu jorge"] },
    { name: "pagode samba", terms: ["pagode", "samba", "ferrugem", "thiaguinho", "sorriso maroto", "exaltasamba"] },
    { name: "lo-fi chill", terms: ["lofi", "lo-fi", "chill", "relax", "ambient", "study", "sleep"] }
];

const IS_PLAYSTATION = /PlayStation|PLAYSTATION/i.test(navigator.userAgent || "");
const PLAYSTATION_INITIAL_LIMIT = 12;
const PLAYSTATION_SEARCH_LIMIT = 10;

if (IS_PLAYSTATION) {
    document.body.classList.add("playstation-mode");
}

let displayList = [];
let tracks = [];
let currentTrack = 0;
let playing = false;
let repeat = false;
let isViewingStaticList = false;
let activeQuery = "";
let ytPlayer = null;
let ytReady = false;
let playerState = -1;
const mobileAudio = document.getElementById("mobileAudio");
let currentDuration = 0;
let nextPageToken = "";
let isLoadingMore = false;
let currentSearchToken = "";
let randomQueryIndex = 0;
let pendingPlayIndex = null;
let shufflePlayedIndices = new Set();
let heroVideoId = null;
const searchCache = new Map();

function isMobileLayout() {
    return window.matchMedia("(max-width: 860px)").matches;
}

function searchLimit(defaultLimit) {
    if (!IS_PLAYSTATION) return defaultLimit;
    return Math.min(defaultLimit, PLAYSTATION_SEARCH_LIMIT);
}

function scopedStorageKey(baseKey) {
    const username = currentUser && currentUser.username ? currentUser.username : "guest";
    return `${baseKey}:${username.toLowerCase()}`;
}

function migrateStorageToCurrentProfile() {
    if (!currentUser || !currentUser.username) return;
    [FAVORITES_KEY, HISTORY_KEY, SEARCH_HISTORY_KEY, PLAYLISTS_KEY].forEach((baseKey) => {
        const profileKey = scopedStorageKey(baseKey);
        if (!localStorage.getItem(profileKey) && localStorage.getItem(baseKey)) {
            localStorage.setItem(profileKey, localStorage.getItem(baseKey));
        }
    });
}

function getSavedProfileVolume() {
    if (!currentUser || !currentUser.username) return null;

    const saved = Number(localStorage.getItem(scopedStorageKey(VOLUME_KEY)));
    if (!Number.isFinite(saved)) return null;
    return Math.max(0, Math.min(100, saved));
}

function setPlayerVolume(volume) {
    const nextVolume = Math.max(0, Math.min(100, Number(volume) || 0));
    volumeControl.value = nextVolume;
    if (mobileVolumeControl) mobileVolumeControl.value = nextVolume;
    if (isMobileLayout() && mobileAudio) {
        mobileAudio.volume = nextVolume / 100;
    }
    if (ytReady && ytPlayer) {
        if (nextVolume > 0 && ytPlayer.unMute) ytPlayer.unMute();
        ytPlayer.setVolume(nextVolume);
    }
}

function applyProfileVolume() {
    const savedVolume = getSavedProfileVolume();
    setPlayerVolume(savedVolume ?? DEFAULT_VOLUME);
}

function saveProfileVolume(volume) {
    if (!currentUser || !currentUser.username) return;
    localStorage.setItem(scopedStorageKey(VOLUME_KEY), String(Math.max(0, Math.min(100, Number(volume) || 0))));
}

function applyTheme(theme) {
    const nextTheme = THEMES.has(theme) ? theme : "default";
    document.body.dataset.theme = nextTheme;
    if (themeSelect) themeSelect.value = nextTheme;
    localStorage.setItem(THEME_KEY, nextTheme);
}

applyTheme(localStorage.getItem(THEME_KEY) || "default");

const FIRST_VISIT_KEY = "camadaplay:first_visit_v1";
const TOTAL_VISITS_KEY = "camadaplay:total_visits_v1";
const UNIQUE_DEVICES_KEY = "camadaplay:unique_devices_v1";

function getVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
}

function getFirstVisit() {
    let firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisit) {
        firstVisit = String(Date.now());
        localStorage.setItem(FIRST_VISIT_KEY, firstVisit);
    }
    return Number(firstVisit) || Date.now();
}

function renderVisitStats(stats) {
    if (!visitorTotal || !visitorActive || !stats) return;
    visitorTotal.textContent = stats.total ?? 0;
    visitorActive.textContent = stats.active ?? 0;
    if (stats.total != null) localStorage.setItem(TOTAL_VISITS_KEY, String(stats.total));
    if (stats.uniqueDevices != null) localStorage.setItem(UNIQUE_DEVICES_KEY, String(stats.uniqueDevices));
}

function sendVisitHeartbeat() {
    try {
        const session = getSession();
        fetch(`${API_BASE}/api/stats/visit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                visitorId: getVisitorId(),
                username: session?.username || null,
                firstVisit: getFirstVisit(),
                totalVisits: Number(localStorage.getItem(TOTAL_VISITS_KEY)) || 0,
                uniqueDevices: Number(localStorage.getItem(UNIQUE_DEVICES_KEY)) || 0
            })
        }).then(r => r.ok ? r.json() : null).then(data => {
            if (data) renderVisitStats(data);
        });
    } catch (error) {
        console.warn("[STATS] Não foi possível atualizar os acessos:", error.message);
    }
}

const RANDOM_QUERIES = [
    "Taylor Swift The Weeknd Dua Lipa Bruno Mars hits",
    "Billie Eilish Ariana Grande Olivia Rodrigo Sabrina Carpenter hits",
    "Bad Bunny Karol G Anitta J Balvin reggaeton latin hits",
    "Kendrick Lamar Drake Travis Scott Kanye West rap hits",
    "Racionais MCs Djonga BK Emicida rap nacional",
    "Ana Castela Gusttavo Lima Henrique e Juliano sertanejo hits",
    "Anitta Luisa Sonza Pabllo Vittar Ludmilla pop brasileiro",
    "BTS BLACKPINK NewJeans Stray Kids kpop hits",
    "Arctic Monkeys Foo Fighters Linkin Park Nirvana rock hits",
    "Queen Bon Jovi Guns N Roses AC DC classic rock hits",
    "Calvin Harris David Guetta Alan Walker Avicii EDM hits",
    "SZA Frank Ocean The Weeknd Daniel Caesar R&B hits",
    "Tom Jobim Caetano Veloso Gilberto Gil Chico Buarque MPB",
    "Charlie Brown Jr Legiao Urbana Cazuza rock nacional",
    "funk brasileiro MC Cabelinho MC Ryan SP Kevin o Chris hits",
    "phonk drift electronic trap workout hits",
    "indie pop Tame Impala Lana Del Rey Arctic Monkeys",
    "80s 90s 2000s pop rock dance hits",
    "anime openings japanese songs popular",
    "lofi chill jazz soul study music"
]

function getRandomQuery() {
    const query = RANDOM_QUERIES[randomQueryIndex % RANDOM_QUERIES.length];
    randomQueryIndex += 1;
    return query;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

console.log("[APP] CamadaPlay inicializado. API_BASE:", API_BASE);

// ===== YOUTUBE PLAYER =====
window.onYTPlayerReady = function(event) {
    console.log("[YT] Player pronto via callback");
    ytReady = true;
    ytPlayer = window.ytPlayerInstanceRef;
    applyProfileVolume();
    if (pendingPlayIndex !== null) {
        const idx = pendingPlayIndex;
        pendingPlayIndex = null;
        loadTrack(idx, true);
    }
};

window.onYTPlayerStateChange = function(event) {
    onYTStateChange(event);
};

window.onYTPlayerError = function(event) {
    console.warn("[YT] Erro de reprodução:", event?.data);
    playing = false;
    setPlayState(false);
    embedHeroVideo(null);

    if (IS_PLAYSTATION && tracks.length > 1 && currentTrack < tracks.length - 1) {
        playNextTrack();
        return;
    }

    if (IS_PLAYSTATION) {
        renderStatus("Essa música não abriu no navegador do PlayStation. Tente outra faixa.", "error");
    }
};

function onYTStateChange(event) {
    playerState = event.data;
    console.log("[YT] Estado mudou:", playerState);

    if (playerState === YT.PlayerState.ENDED) {
        playing = false;
        setPlayState(false);
        embedHeroVideo(null);
        if (repeat) {
            loadTrack(currentTrack, true);
        } else {
            playNextTrack();
        }
    } else if (playerState === YT.PlayerState.PLAYING) {
        playing = true;
        setPlayState(true);
        const track = tracks[currentTrack];
        if (track) {
            embedHeroVideo(track.id);
            syncHeroVideoPlayback(true);
        }
    } else if (playerState === YT.PlayerState.PAUSED) {
        playing = false;
        setPlayState(false);
        syncHeroVideoPlayback(false);
    }
}

// ===== UTILITARIOS =====
function debounce(callback, delay = 350) {
    let timeoutId;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => callback(...args), delay);
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function coverFor(id) {
    return COVER_CLASSES[Math.abs(String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_CLASSES.length)];
}

function heartIcon(filled) {
    return `
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <path ${filled ? "" : "fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\""} d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11z"></path>
        </svg>
    `;
}

function getFavorites() {
    try {
        const saved = JSON.parse(localStorage.getItem(scopedStorageKey(FAVORITES_KEY)));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(scopedStorageKey(FAVORITES_KEY), JSON.stringify(list));
}

function isFavorite(id) {
    return getFavorites().some((track) => String(track.id) === String(id));
}

function toggleFavorite(track) {
    if (!track) return false;
    const list = getFavorites();
    const found = list.some((item) => String(item.id) === String(track.id));
    if (found) {
        saveFavorites(list.filter((item) => String(item.id) !== String(track.id)));
    } else {
        saveFavorites(list.concat({ ...track }));
    }
    return !found;
}

// ===== PLAYLISTS =====
function getPlaylists() {
    try {
        const saved = JSON.parse(localStorage.getItem(scopedStorageKey(PLAYLISTS_KEY)));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function savePlaylists(list) {
    localStorage.setItem(scopedStorageKey(PLAYLISTS_KEY), JSON.stringify(list));
}

function createPlaylist(name) {
    const playlists = getPlaylists();
    const newPlaylist = { id: crypto.randomUUID(), name, tracks: [], createdAt: Date.now() };
    playlists.push(newPlaylist);
    savePlaylists(playlists);
    return newPlaylist;
}

function deletePlaylist(id) {
    savePlaylists(getPlaylists().filter(p => p.id !== id));
}

function addTrackToPlaylist(playlistId, track) {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    if (!playlist.tracks.some(t => t.id === track.id)) {
        playlist.tracks.push({ id: track.id, title: track.title, artist: track.artist, cover: track.cover, duration: track.duration, image: track.image || "" });
        savePlaylists(playlists);
        return true;
    }
    return false;
}

function removeTrackFromPlaylist(playlistId, trackId) {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    savePlaylists(playlists);
}

function isTrackInPlaylist(playlistId, trackId) {
    const playlist = getPlaylists().find(p => p.id === playlistId);
    return playlist ? playlist.tracks.some(t => t.id === trackId) : false;
}

// ===== HISTORICO =====
function getHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(scopedStorageKey(HISTORY_KEY)));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveHistory(list) {
    localStorage.setItem(scopedStorageKey(HISTORY_KEY), JSON.stringify(list));
}

// ===== HISTORICO DE PESQUISAS =====
function getSearchHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(scopedStorageKey(SEARCH_HISTORY_KEY)));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function recordSearch(query) {
    if (!query || !query.trim()) return;
    const history = getSearchHistory();
    const term = query.trim().toLowerCase();
    const existing = history.find(item => item.term === term);
    if (existing) {
        existing.count = (existing.count || 0) + 1;
        existing.lastSearched = Date.now();
    } else {
        history.push({ term, count: 1, lastSearched: Date.now() });
    }
    // Manter apenas as 20 pesquisas mais recentes
    const trimmed = history.sort((a, b) => b.lastSearched - a.lastSearched).slice(0, 20);
    localStorage.setItem(scopedStorageKey(SEARCH_HISTORY_KEY), JSON.stringify(trimmed));
}

function getTopSearchTerms(limit = 5) {
    const history = getSearchHistory();
    return history.sort((a, b) => b.count - a.count).slice(0, limit).map(item => item.term);
}

function recordPlay(track) {
    if (!track) return;
    const history = getHistory();
    const existing = history.find((item) => String(item.id) === String(track.id));
    if (existing) {
        existing.count = (existing.count || 0) + 1;
        existing.lastPlayed = Date.now();
    } else {
        history.push({
            id: track.id,
            title: track.title,
            artist: track.artist,
            count: 1,
            lastPlayed: Date.now()
        });
    }
    saveHistory(history);
    console.log(`[HIST] Registro salvo: ${track.title} (${existing ? existing.count : 1}x)`);
}

function getRecommendationSignals() {
    const signals = [];

    getHistory().forEach((item) => {
        signals.push({ ...item, count: item.count || 1, source: "history" });
    });

    getFavorites().forEach((item) => {
        signals.push({ ...item, count: 2, source: "favorite" });
    });

    return signals;
}

function hasRecommendationSignals() {
    return getRecommendationSignals().length > 0 || getSearchHistory().length > 0;
}

function getTopArtists(limit = 5) {
    const artistCounts = {};
    getRecommendationSignals().forEach((item) => {
        const artist = item.artist || "Desconhecido";
        artistCounts[artist] = (artistCounts[artist] || 0) + (item.count || 1);
    });
    return Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([artist]) => artist);
}

function getTopTitles(limit = 5) {
    const titleCounts = {};
    getRecommendationSignals().forEach((item) => {
        const title = item.title || "";
        if (title) {
            titleCounts[title] = (titleCounts[title] || 0) + (item.count || 1);
        }
    });
    return Object.entries(titleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([title]) => title);
}

function cleanSignalText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s'-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function detectCategoriesFromText(text) {
    const normalized = cleanSignalText(text);
    return CATEGORY_KEYWORDS
        .filter((category) => category.terms.some((term) => normalized.includes(cleanSignalText(term))))
        .map((category) => category.name);
}

function getTopCategories(limit = 4) {
    const categoryCounts = {};
    getRecommendationSignals().forEach((item) => {
        const weight = item.count || 1;
        detectCategoriesFromText(`${item.title} ${item.artist}`).forEach((category) => {
            categoryCounts[category] = (categoryCounts[category] || 0) + weight;
        });
    });
    getSearchHistory().forEach((item) => {
        detectCategoriesFromText(item.term).forEach((category) => {
            categoryCounts[category] = (categoryCounts[category] || 0) + (item.count || 1);
        });
    });
    return Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category]) => category);
}

function getRecommendationSeeds(limit = 6) {
    const ignored = new Set(["official", "video", "audio", "lyrics", "lyric", "clip", "music", "feat", "ft", "remix", "ao", "vivo", "live", "show", "full", "album"]);
    const counts = {};
    getRecommendationSignals().forEach((item) => {
        const weight = item.count || 1;
        cleanSignalText(`${item.title} ${item.artist}`)
            .split(" ")
            .filter((word) => word.length > 2 && !ignored.has(word))
            .forEach((word) => {
                counts[word] = (counts[word] || 0) + weight;
            });
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word]) => word);
}

function filterKnownTracks(list) {
    const knownIds = new Set(getRecommendationSignals().map((track) => String(track.id)));
    return list.filter((track) => !knownIds.has(String(track.id)));
}

// ===== API =====
async function fetchSearch(query, limit = 24, pageToken = "") {
    let url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    console.log(`[FETCH] Buscando: ${url}`);

    const response = await fetch(url);
    console.log(`[FETCH] Resposta HTTP: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FETCH] Erro HTTP ${response.status}:`, errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[FETCH] Dados recebidos:`, {
        hasResults: !!data.results,
        resultsCount: data.results ? data.results.length : 0,
        error: data.error || null,
        keys: Object.keys(data)
    });

    if (data.error) {
        console.error(`[FETCH] API retornou erro:`, data.error);
        throw new Error(data.error);
    }

    const results = data.results || [];
    const nextToken = data.nextPageToken || "";
    console.log(`[FETCH] ${results.length} resultados mapeados, nextPageToken: "${nextToken}"`);
    return { results, nextPageToken: nextToken };
}

async function fetchRecommendations(limit = 12) {
    const topArtists = getTopArtists(5);
    const topTitles = getTopTitles(5);
    const topSearches = getTopSearchTerms(5);
    const topCategories = getTopCategories(4);
    const seeds = getRecommendationSeeds(6);
    console.log(`[RECOMMEND] Dados do usuario:`, { topArtists, topTitles, topSearches, topCategories, seeds });
    const url = `${API_BASE}/api/recommend?artists=${encodeURIComponent(topArtists.join(','))}&titles=${encodeURIComponent(topTitles.join(','))}&searches=${encodeURIComponent(topSearches.join(','))}&categories=${encodeURIComponent(topCategories.join(','))}&seeds=${encodeURIComponent(seeds.join(','))}&limit=${limit}`;
    console.log(`[RECOMMEND] URL completa:`, url);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }

    return data.results || [];
}

function mapTrack(track) {
    return {
        id: track.id,
        title: track.title || "Sem título",
        artist: track.artist || "CamadaPlay",
        cover: coverFor(track.id),
        time: "0:00",
        durationSeconds: 0,
        image: track.thumbnail || ""
    };
}

// ===== UI =====
function setHeader(title, eyebrow, text, section) {
    viewTitle.innerHTML = title;
    heroEyebrow.textContent = eyebrow;
    heroText.textContent = text;
    sectionTitle.textContent = section;
}

function embedHeroVideo(videoId, startAt = null) {
    console.log('[HERO] embedHeroVideo chamado com videoId:', videoId);
    console.log('[HERO] heroVideo element:', heroVideo);
    if (!heroVideo) {
        console.warn('[HERO] heroVideo element não encontrado!');
        return;
    }
    const rightBg = document.getElementById('rightPanelBg');
    if (IS_PLAYSTATION) {
        heroVideo.innerHTML = '';
        heroVideo.style.display = 'none';
        heroCover.style.opacity = '';
        if (rightBg) rightBg.innerHTML = '';
        heroVideoId = null;
        return;
    }

    if (!videoId) {
        heroVideo.innerHTML = '';
        heroVideo.style.display = 'none';
        heroCover.style.opacity = '';
        if (rightBg) rightBg.innerHTML = '';
        heroVideoId = null;
        console.log('[HERO] Video removido');
        return;
    }

    if (heroVideoId === videoId && heroVideo.querySelector('iframe')) {
        heroVideo.style.display = 'block';
        heroCover.style.opacity = '0';
        return;
    }

    heroVideoId = videoId;
    heroVideo.style.display = 'block';
    heroCover.style.opacity = '0';
    const start = startAt ?? (ytReady && ytPlayer ? Math.floor(ytPlayer.getCurrentTime() || 0) : 0);
    const iframeSrc = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&disablekb=1&fs=0&cc_load_policy=0&start=${start}`;
    const iframeHtml = `
        <iframe 
            src="${iframeSrc}" 
            frameborder="0" 
            allow="autoplay; encrypted-media" 
            allowfullscreen>
        </iframe>
    `;
    heroVideo.innerHTML = iframeHtml;
    if (rightBg) rightBg.innerHTML = iframeHtml;
    console.log('[HERO] Video embedado:', videoId);
}

function sendHeroVideoCommand(func, args = []) {
    [heroVideo, document.getElementById('rightPanelBg')].forEach((container) => {
        if (!container) return;
        container.querySelectorAll('iframe').forEach((iframe) => {
            iframe.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func,
                args
            }), '*');
        });
    });
}

function syncHeroVideoPlayback(shouldPlay) {
    if (IS_PLAYSTATION) return;
    const current = ytReady && ytPlayer ? ytPlayer.getCurrentTime() || 0 : 0;
    sendHeroVideoCommand('seekTo', [current, true]);
    sendHeroVideoCommand(shouldPlay ? 'playVideo' : 'pauseVideo');
}

function renderStatus(message, type = "info") {
    madeForYou.innerHTML = `<p class="status-msg ${type}">${escapeHtml(message)}</p>`;
    queueList.innerHTML = `<p class="queue-empty">${escapeHtml(message)}</p>`;
}

function getTrackImage(track) {
    if (track.image) return track.image;
    if (track.id && !track.id.startsWith("local-")) return `https://img.youtube.com/vi/${track.id}/mqdefault.jpg`;
    return "";
}

function cardCover(track) {
    const image = getTrackImage(track);
    const imgTag = image
        ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
    return `<span class="cover ${escapeHtml(track.cover)}">${imgTag}</span>`;
}

function setCoverImage(element, track) {
    element.className = `cover ${track && track.cover ? track.cover : "cover-one"}`;
    const image = track ? getTrackImage(track) : "";
    element.innerHTML = image
        ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
}

function renderCards(list) {
    console.log(`[RENDER] renderCards chamado com ${list.length} músicas`);

    madeForYou.innerHTML = list.map((track, index) => `
        <button class="mix-card" type="button" data-index="${index}">
            ${cardCover(track)}
            <strong>${escapeHtml(track.title)}</strong>
            <small>${escapeHtml(track.artist)}</small>
        </button>
    `).join("");

    const existingLoading = document.querySelector(".loading-more");
    if (existingLoading) existingLoading.remove();

    if (isLoadingMore && nextPageToken) {
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "loading-more";
        loadingDiv.textContent = "Carregando mais músicas...";
        madeForYou.parentElement.appendChild(loadingDiv);
    }

    console.log(`[RENDER] ${list.length} cards renderizados`);
}

function getQueueSlice() {
    const current = tracks[currentTrack];
    return displayList.map((track, index) => ({
        track,
        index,
        active: Boolean(current && track.id === current.id)
    }));
}

function renderQueue() {
    const previousScroll = queueList.scrollTop;
    const queue = getQueueSlice();
    if (!queue.length) {
        queueList.innerHTML = "<p class=\"queue-empty\">Nenhuma música na fila.</p>";
        return;
    }
    queueList.innerHTML = queue.map(({ track, index, active }) => `
        <button class="queue-item ${active ? "active" : ""}" type="button" data-index="${index}">
            ${cardCover(track)}
            <span>
                <strong>${escapeHtml(track.title)}</strong>
                <small>${escapeHtml(track.artist)}</small>
            </span>
            <time>${escapeHtml(track.time)}</time>
        </button>
    `).join("");
    queueList.scrollTop = previousScroll;
}

function renderFavButtons(track) {
    const saved = track && isFavorite(track.id);
    [favPlayer, favSide].forEach((button) => {
        button.classList.toggle("active", Boolean(saved));
        button.innerHTML = heartIcon(Boolean(saved));
        button.setAttribute("aria-pressed", String(Boolean(saved)));
    });
}

function setPlayState(isPlaying) {
    [playPause, sidePlayPause].forEach((button) => {
        button.classList.toggle("is-playing", isPlaying);
        button.setAttribute("aria-label", isPlaying ? "Pausar" : "Tocar");
    });
    if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
}

function updatePlayButtons(isPlaying) {
    [playPause, sidePlayPause].forEach((button) => {
        button.classList.toggle("is-playing", isPlaying);
        button.setAttribute("aria-label", isPlaying ? "Pausar" : "Tocar");
    });
}

function renderPlayer() {
    const track = tracks[currentTrack];
    if (!track) {
        playerTitle.textContent = "Nenhuma música";
        playerArtist.textContent = "Escolha uma faixa para tocar";
        sideTitle.textContent = "Nenhuma música";
        sideArtist.textContent = "Escolha uma faixa";
        setCoverImage(playerCover, null);
        setCoverImage(sideCover, null);
        heroCover.innerHTML = '';
        sideCurrentTime.textContent = "0:00";
        sideDurationTime.textContent = "0:00";
        sideProgressControl.value = 0;
        mobileCurrentTime.textContent = "0:00";
        mobileDurationTime.textContent = "0:00";
        mobileProgressControl.value = 0;
        setPlayState(false);
        renderFavButtons(null);
        renderQueue();
        embedHeroVideo(null);
        return;
    }
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;
    sideTitle.textContent = track.title;
    sideArtist.textContent = track.artist;
    if (!playing) {
        sideDurationTime.textContent = formatTime(currentDuration || track.durationSeconds);
        mobileDurationTime.textContent = formatTime(currentDuration || track.durationSeconds);
    }
    setCoverImage(playerCover, track);
    setCoverImage(sideCover, track);
    heroCover.innerHTML = track.image ? `<img src="${escapeHtml(track.image)}" alt="">` : '';
    setPlayState(playing);
    renderFavButtons(track);
    renderQueue();
    updateMediaSession(track);
}

function updateMediaSession(track) {
    if (!("mediaSession" in navigator)) return;
    const artwork = track && track.image ? [{ src: track.image, sizes: "256x256", type: "image/jpeg" }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
        title: track ? track.title : "CamadaPlay",
        artist: track ? track.artist : "",
        album: "CamadaPlay",
        artwork
    });
    navigator.mediaSession.setActionHandler("play", () => {
        if (isMobileLayout()) { mobileAudio.play(); playing = true; setPlayState(true); }
        else if (ytPlayer && ytReady) { ytPlayer.playVideo(); playing = true; setPlayState(true); }
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        if (isMobileLayout()) { mobileAudio.pause(); playing = false; setPlayState(false); }
        else if (ytPlayer && ytReady) { ytPlayer.pauseVideo(); playing = false; setPlayState(false); }
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => loadTrack(currentTrack - 1, true));
    navigator.mediaSession.setActionHandler("nexttrack", () => playNextTrack());
    navigator.mediaSession.playbackState = "playing";
}

// ===== MOBILE AUDIO EVENTS =====
if (mobileAudio) {
    mobileAudio.addEventListener("ended", () => {
        playing = false;
        playNextTrack();
    });
    mobileAudio.addEventListener("timeupdate", () => {
        if (!isMobileLayout()) return;
        const cur = mobileAudio.currentTime || 0;
        const dur = mobileAudio.duration || 0;
        mobileCurrentTime.textContent = formatTime(cur);
        if (dur > 0) {
            mobileDurationTime.textContent = formatTime(dur);
            mobileProgressControl.value = (cur / dur) * 100;
        }
        if ("mediaSession" in navigator && dur > 0) {
            navigator.mediaSession.setPositionState({ duration: dur, playbackRate: 1, position: cur });
        }
    });
}

// ===== REPRODUÇÃO =====
function loadTrack(index, shouldPlay) {
    if (!tracks.length) {
        if (displayList.length) {
            tracks = displayList.slice();
        } else {
            renderPlayer();
            return;
        }
    }
    currentTrack = index < 0 ? tracks.length - 1 : Math.min(index, tracks.length - 1);
    const track = tracks[currentTrack];
    console.log(`[PLAY] Carregando faixa ${currentTrack}: ${track.title} (ID: ${track.id})`);

    playing = false;
    setPlayState(false);
    sideProgressControl.value = 0;
    sideCurrentTime.textContent = "0:00";
    mobileProgressControl.value = 0;
    mobileCurrentTime.textContent = "0:00";
    currentDuration = 0;
    renderPlayer();

    if (shouldPlay) {
        recordPlay(track);
        playerEl.classList.add("visible");
        appEl.classList.add("player-open");
        if (!isMobileLayout()) {
            rightPanel.classList.add("visible");
            appEl.classList.add("panel-open");
        } else {
            rightPanel.classList.remove("visible");
            appEl.classList.remove("panel-open");
        }
    }

    if (isMobileLayout()) {
        embedHeroVideo(track.id, 0);
        if (shouldPlay) {
            let settled = false;
            const cleanup = () => {
                mobileAudio.removeEventListener("canplay", onCanPlay);
                mobileAudio.removeEventListener("error", onError);
                clearTimeout(timeoutId);
            };
            const onCanPlay = () => {
                if (settled) return;
                settled = true;
                cleanup();
                mobileAudio.play().then(() => {
                    playing = true;
                    setPlayState(true);
                }).catch(() => fallbackToYT());
            };
            const onError = () => {
                if (settled) return;
                settled = true;
                cleanup();
                fallbackToYT();
            };
            const fallbackToYT = () => {
                if (!ytReady || !ytPlayer) return;
                try {
                    ytPlayer.loadVideoById(track.id);
                    applyProfileVolume();
                    if (ytPlayer.unMute) ytPlayer.unMute();
                    ytPlayer.playVideo();
                    playing = true;
                    setPlayState(true);
                } catch (_) {}
            };
            const timeoutId = setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                if (!mobileAudio.paused && mobileAudio.currentTime > 0) return;
                fallbackToYT();
            }, 10000);
            mobileAudio.addEventListener("canplay", onCanPlay);
            mobileAudio.addEventListener("error", onError);
        }
        mobileAudio.src = `/api/stream/${track.id}`;
        mobileAudio.load();
        return;
    }

    if (!ytReady || !ytPlayer) {
        console.warn("[PLAY] YouTube player ainda não está pronto, adicionando a fila");
        pendingPlayIndex = index;
        return;
    }

    try {
        ytPlayer.loadVideoById(track.id);
        applyProfileVolume();
        embedHeroVideo(track.id, 0);
        if (shouldPlay) {
            if (ytPlayer.unMute) ytPlayer.unMute();
            ytPlayer.playVideo();
            playing = true;
            setPlayState(true);
            syncHeroVideoPlayback(true);
        } else {
            syncHeroVideoPlayback(false);
        }
    } catch (err) {
        console.error("[PLAY] Erro ao carregar video:", err);
        playing = false;
        setPlayState(false);
    }
}

function playFromDisplay(index) {
    tracks = displayList.slice();
    loadTrack(index, true);
}

function togglePlay() {
    if (!tracks[currentTrack]) {
        if (displayList.length) playFromDisplay(0);
        return;
    }

    if (isMobileLayout()) {
        if (mobileAudio.paused) {
            mobileAudio.play();
            playing = true;
            setPlayState(true);
        } else {
            mobileAudio.pause();
    playing = false;
    updatePlayButtons(false);
        }
        return;
    }

    if (!ytReady || !ytPlayer) return;

    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        syncHeroVideoPlayback(false);
    } else {
        applyProfileVolume();
        if (ytPlayer.unMute) ytPlayer.unMute();
        ytPlayer.playVideo();
        syncHeroVideoPlayback(true);
    }
}

async function playNextTrack() {
    if (repeat) {
        loadTrack(currentTrack, true);
        return;
    }

    if (!tracks.length && displayList.length) {
        tracks = displayList.slice();
    }

    const nextIndex = currentTrack + 1;
    if (nextIndex < tracks.length) {
        loadTrack(nextIndex, true);
        return;
    }

    const added = await loadMore();
    if (added > 0 && nextIndex < tracks.length) {
        loadTrack(nextIndex, true);
        return;
    }

    playing = false;
    setPlayState(false);
}

// ===== CARREGAR DADOS =====
async function loadView(query) {
    isViewingStaticList = false;
    const randomQuery = getRandomQuery();
    console.log(`[VIEW] loadView chamado - query original: "${query}", random: "${randomQuery}"`);
    activeQuery = query;
    currentSearchToken = randomQuery;
    nextPageToken = "";
    setHeader(
        "Camada<span>Play</span>",
        "Bem-vindo ao",
        "Sua música. Seu mundo.",
        "Feito para você"
    );

    if (searchCache.has(randomQuery)) {
        const cached = searchCache.get(randomQuery);
        displayList = [...cached];
        nextPageToken = "";
        renderCards(displayList);
        renderQueue();
        console.log(`[VIEW] ${displayList.length} músicas carregadas do cache`);
        return;
    }

    renderStatus("Carregando músicas...", "loading");

    try {
        const data = await fetchSearch(randomQuery, IS_PLAYSTATION ? PLAYSTATION_INITIAL_LIMIT : 34);
        console.log(`[VIEW] ${data.results.length} resultados recebidos da API`);

        let tracks = data.results.map(mapTrack);
        tracks = shuffleArray(tracks);
        displayList = tracks;
        nextPageToken = data.nextPageToken;
        searchCache.set(randomQuery, [...tracks]);
        console.log(`[VIEW] displayList atualizado: ${displayList.length} músicas (embaralhadas)`);

        renderCards(displayList);
        renderQueue();
        console.log(`[VIEW] UI renderizada com sucesso`);
    } catch (error) {
        console.error(`[VIEW] Erro ao carregar:`, error.message);
        renderStatus(`Erro ao carregar: ${error.message}`, "error");
    }
}

async function loadRecommendations() {
    isViewingStaticList = false;
    console.log(`[RECOMMEND] Carregando recomendações`);
    setHeader(
        "Recomendado<span>Pra Você</span>",
        "Baseado no seu gosto",
        "Músicas que você pode curtir.",
        "Recomendado pra você"
    );

    if (searchCache.has("recommend")) {
        const cached = searchCache.get("recommend");
        displayList = [...cached];
        currentSearchToken = "recommend";
        nextPageToken = "";
        renderCards(displayList);
        renderQueue();
        console.log(`[RECOMMEND] ${displayList.length} músicas carregadas do cache`);
        return;
    }

    renderStatus("Carregando recomendações...", "loading");

    try {
        const results = await fetchRecommendations(IS_PLAYSTATION ? PLAYSTATION_INITIAL_LIMIT : 24);
        console.log(`[RECOMMEND] ${results.length} recomendações recebidas`);

        displayList = filterKnownTracks(results.map(mapTrack));
        if (!displayList.length) {
            displayList = results.map(mapTrack);
        }
        currentSearchToken = "recommend";
        nextPageToken = "";
        searchCache.set("recommend", [...displayList]);
        console.log(`[RECOMMEND] displayList atualizado: ${displayList.length} músicas`);

        renderCards(displayList);
        renderQueue();
        console.log(`[RECOMMEND] UI renderizada com sucesso`);
    } catch (error) {
        console.error(`[RECOMMEND] Erro ao carregar:`, error.message);
        renderStatus(`Erro ao carregar recomendações: ${error.message}`, "error");
    }
}

async function performSearch(query) {
    const term = query.trim();
    if (!term) {
        loadView(activeQuery || getRandomQuery());
        return;
    }

    // Salvar no histórico de pesquisas
    recordSearch(term);

    setHeader(
        "Camada<span>Play</span>",
        "Bem-vindo ao",
        "Sua música. Seu mundo.",
        "Feito para você"
    );
    renderStatus("Buscando...", "loading");

    try {
        const data = await fetchSearch(term, searchLimit(24));
        displayList = shuffleArray(data.results.map(mapTrack));
        nextPageToken = data.nextPageToken;
        currentSearchToken = term;
        console.log(`[SEARCH] displayList: ${displayList.length} músicas`);
        renderCards(displayList);
        renderQueue();
    } catch (error) {
        console.error(`[SEARCH] Erro na busca:`, error.message);
        renderStatus(`Erro na busca: ${error.message}`, "error");
    }
}

async function loadMore() {
    if (isLoadingMore) {
        return 0;
    }

    isLoadingMore = true;
    const newQuery = getRandomQuery();
    console.log(`[LOADMORE] Carregando mais músicas - nova query: "${newQuery}"`);

    try {
        let data;
        if (currentSearchToken === "recommend") {
            const results = await fetchRecommendations(searchLimit(12));
            data = { results: shuffleArray(results), nextPageToken: "" };
        } else if (nextPageToken) {
            data = await fetchSearch(currentSearchToken, searchLimit(12), nextPageToken);
        } else {
            data = await fetchSearch(newQuery, searchLimit(12));
            currentSearchToken = newQuery;
        }

        const newTracks = data.results.map(mapTrack);
        const shuffledNew = shuffleArray(newTracks);
        const existingIds = new Set(displayList.map(track => track.id));
        const uniqueNew = shuffledNew.filter(track => !existingIds.has(track.id));
        displayList = [...displayList, ...uniqueNew];
        if (tracks.length) {
            const queuedIds = new Set(tracks.map(track => track.id));
            tracks = [...tracks, ...uniqueNew.filter(track => !queuedIds.has(track.id))];
        }
        nextPageToken = data.nextPageToken;
        console.log(`[LOADMORE] ${uniqueNew.length} novas músicas, total: ${displayList.length}`);

        renderCards(displayList);
        renderQueue();
        return uniqueNew.length;
    } catch (error) {
        console.error(`[LOADMORE] Erro ao carregar mais:`, error.message);
        return 0;
    } finally {
        isLoadingMore = false;
    }
}

function toggleShuffle() {
    if (!displayList.length) return;
    shufflePlayedIndices.clear();
    displayList = displayList.slice().sort(() => Math.random() - 0.5);
    tracks = displayList.slice();
    shufflePlayedIndices.add(0);
    renderCards(displayList);
    loadTrack(0, true);
}

function getNextShuffleIndex() {
    if (!tracks.length) return 0;
    if (shufflePlayedIndices.size >= tracks.length) {
        shufflePlayedIndices.clear();
    }
    let idx;
    do {
        idx = Math.floor(Math.random() * tracks.length);
    } while (shufflePlayedIndices.has(idx) && shufflePlayedIndices.size < tracks.length);
    shufflePlayedIndices.add(idx);
    return idx;
}

function toggleRepeat() {
    repeat = !repeat;
    repeatButtons.forEach((button) => button.classList.toggle("active", repeat));
}

// ===== EVENTOS =====
function bindCardClicks(container) {
    container.addEventListener("click", (event) => {
        const card = event.target.closest(".mix-card");
        if (card) playFromDisplay(Number(card.dataset.index));
    });
}

bindCardClicks(madeForYou);

queueList.addEventListener("click", (event) => {
    const item = event.target.closest(".queue-item");
    if (!item) return;
    playFromDisplay(Number(item.dataset.index));
});

[playPause, sidePlayPause].forEach((button) => button.addEventListener("click", togglePlay));
[previous, sidePrevious].forEach((button) => button.addEventListener("click", () => loadTrack(currentTrack - 1, true)));
[next, sideNext].forEach((button) => button.addEventListener("click", playNextTrack));
shuffleButtons.forEach((button) => button.addEventListener("click", toggleShuffle));
repeatButtons.forEach((button) => button.addEventListener("click", toggleRepeat));

playerEl.addEventListener("click", (event) => {
    if (!isMobileLayout() || !tracks.length) return;
    if (event.target.closest("button, input")) return;
    rightPanel.classList.toggle("visible");
});

[favPlayer, favSide].forEach((button) => {
    button.addEventListener("click", () => {
        const track = tracks[currentTrack];
        if (track) {
            toggleFavorite(track);
            renderFavButtons(track);
        }
    });
});

// ===== SCROLL INFINITO =====
const contentArea = document.querySelector(".content");
const queueArea = document.querySelector(".queue-list");

function handleContentScroll() {
    if (!contentArea || isLoadingMore || isViewingStaticList) return;
    const scrollingElement = isMobileLayout() ? document.documentElement : contentArea;
    const { scrollTop, scrollHeight, clientHeight } = scrollingElement;
    if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMore();
    }
}

function handleQueueScroll() {
    if (!queueArea || isLoadingMore || currentSearchToken === "recommend") return;
    const { scrollTop, scrollHeight, clientHeight } = queueArea;
    if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMore();
    }
}

if (contentArea) {
    contentArea.addEventListener("scroll", debounce(handleContentScroll, 200));
}
window.addEventListener("scroll", debounce(handleContentScroll, 200), { passive: true });
if (queueArea) {
    queueArea.addEventListener("scroll", debounce(handleQueueScroll, 200));
}

// ===== MANTER MUSICA EM SEGUNDO PLANO =====
document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (isMobileLayout() && mobileAudio && playing && mobileAudio.paused) {
        setTimeout(() => { mobileAudio.play().catch(() => {}); }, 400);
    } else if (ytReady && ytPlayer && playing) {
        setTimeout(() => {
            try {
                const state = ytPlayer.getPlayerState && ytPlayer.getPlayerState();
                if (state !== YT.PlayerState.PLAYING) ytPlayer.playVideo();
            } catch (_) {}
        }, 600);
    }
});

// ===== RECOMENDACAO =====
const recommendBtn = document.querySelector("#heroPlay");
if (recommendBtn) {
    recommendBtn.addEventListener("click", () => {
        if (hasRecommendationSignals()) {
            loadRecommendations();
        } else if (displayList.length) {
            playFromDisplay(0);
        }
    });
}

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        isViewingStaticList = false;
        madeForYou.classList.remove("biblioteca-view");
        if (heroSection) heroSection.style.display = "";
        const shelfHeading = document.querySelector(".section-heading");
        if (shelfHeading) shelfHeading.style.display = "";
        menuItems.forEach((menuItem) => menuItem.classList.toggle("active", menuItem === item));
        if (item.dataset.view === "buscar") {
            searchInput.focus();
            return;
        }
        if (item.dataset.view === "recomendar") {
            if (!hasRecommendationSignals()) {
                setHeader("Recomendado<span>Pra Você</span>", "Sem sinais ainda", "Toque, pesquise ou curta músicas pra gerar recomendações.", "Recomendado pra você");
                renderStatus("Toque, pesquise ou curta músicas pra gerar recomendações.");
                displayList = [];
                renderPlayer();
                return;
            }
            loadRecommendations();
            return;
        }
        if (item.dataset.view === "playlist") {
            playlistModal.classList.add("open");
            playlistNameInput.value = "";
            playlistNameInput.focus();
            return;
        }
        if (item.dataset.view === "biblioteca") {
            renderBiblioteca();
            return;
        }
        if (item.dataset.view === "favoritos") {
            const favs = getFavorites();
            if (!favs.length) {
                setHeader("Músicas<span>Curtidas</span>", "Salvas por você", "Nenhuma música curtida ainda.", "Músicas curtidas");
                renderStatus("Nenhuma música curtida ainda.");
                displayList = [];
                isViewingStaticList = true;
                renderPlayer();
                return;
            }
            setHeader("Músicas<span>Curtidas</span>", "Salvas por você", "As músicas marcadas com coração ficam aqui.", "Músicas curtidas");
            displayList = favs;
            isViewingStaticList = true;
            renderCards(displayList);
            renderQueue();
            return;
        }
        loadView(getRandomQuery());
    });
});

playlistItems.forEach((item) => {
    item.addEventListener("click", () => {
        playlistItems.forEach((playlistItem) => playlistItem.classList.toggle("active", playlistItem === item));
        const query = item.dataset.query;
        const type = item.dataset.type;
        if (type === "genre") {
            performSearch(`${query} music hits`);
        } else {
            performSearch(query);
        }
    });
});

const onSearch = debounce(() => performSearch(searchInput.value));

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    performSearch(searchInput.value);
});

searchInput.addEventListener("input", () => {
    if (searchInput.value.trim()) {
        onSearch();
    } else {
        loadView(getRandomQuery());
    }
});

// ===== PROGRESSO =====
setInterval(() => {
    if (ytReady && ytPlayer && playing) {
        const current = ytPlayer.getCurrentTime() || 0;
        const duration = ytPlayer.getDuration() || 0;
        currentDuration = duration;
        sideCurrentTime.textContent = formatTime(current);
        mobileCurrentTime.textContent = formatTime(current);
        if (duration > 0) {
            sideDurationTime.textContent = formatTime(duration);
            mobileDurationTime.textContent = formatTime(duration);
            sideProgressControl.value = String((current / duration) * 100);
            mobileProgressControl.value = String((current / duration) * 100);
        }
    }
}, 500);

function seekFromProgress(control) {
    if (isMobileLayout() && mobileAudio && mobileAudio.duration > 0) {
        const seekTo = (Number(control.value) / 100) * mobileAudio.duration;
        mobileAudio.currentTime = seekTo;
        sideProgressControl.value = control.value;
        mobileProgressControl.value = control.value;
        sideCurrentTime.textContent = formatTime(seekTo);
        mobileCurrentTime.textContent = formatTime(seekTo);
    } else if (ytReady && ytPlayer && currentDuration > 0) {
        const seekTo = (Number(control.value) / 100) * currentDuration;
        ytPlayer.seekTo(seekTo, true);
        sendHeroVideoCommand('seekTo', [seekTo, true]);
        sideProgressControl.value = control.value;
        mobileProgressControl.value = control.value;
        sideCurrentTime.textContent = formatTime(seekTo);
        mobileCurrentTime.textContent = formatTime(seekTo);
    }
}

sideProgressControl.addEventListener("input", () => seekFromProgress(sideProgressControl));
mobileProgressControl.addEventListener("input", () => seekFromProgress(mobileProgressControl));

volumeControl.addEventListener("input", () => {
    setPlayerVolume(volumeControl.value);
    saveProfileVolume(volumeControl.value);
});

mobileVolumeControl?.addEventListener("input", () => {
    setPlayerVolume(mobileVolumeControl.value);
    saveProfileVolume(mobileVolumeControl.value);
});

mobileVolumeToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const expanded = mobileVolumeBox.classList.toggle("open");
    mobileVolumeToggle.setAttribute("aria-expanded", String(expanded));
});

volumeToggle?.addEventListener("click", (event) => {
    if (!isMobileLayout()) return;
    event.stopPropagation();
    const expanded = volumeBox.classList.toggle("open");
    volumeToggle.setAttribute("aria-expanded", String(expanded));
});

document.addEventListener("click", (event) => {
    if (mobileVolumeBox?.classList.contains("open") && !mobileVolumeBox.contains(event.target)) {
        mobileVolumeBox.classList.remove("open");
        mobileVolumeToggle?.setAttribute("aria-expanded", "false");
    }

    if (!volumeBox || !isMobileLayout() || !volumeBox.classList.contains("open")) return;
    if (volumeBox.contains(event.target)) return;
    volumeBox.classList.remove("open");
    volumeToggle?.setAttribute("aria-expanded", "false");
});

// Inicializar
renderFavButtons(null);
renderPlayer();

// Verificar se YouTube API ja carregou
if (window.ytReadyFlag && window.ytPlayerInstanceRef) {
    console.log("[YT] YouTube ja estava pronto");
    ytReady = true;
    ytPlayer = window.ytPlayerInstanceRef;
    applyProfileVolume();
}

loadView(getRandomQuery());

// ===== FERRAMENTAS DO PLAYER =====
const toggleLyrics = document.getElementById("toggleLyrics");
const toggleFullscreen = document.getElementById("toggleFullscreen");
const lyricsPanel = document.getElementById("lyricsPanel");
const lyricsContent = document.getElementById("lyricsContent");

// Toggle Lyrics
toggleLyrics.addEventListener("click", () => {
    lyricsPanel.classList.toggle("open");
    if (lyricsPanel.classList.contains("open")) {
        const track = tracks[currentTrack];
        if (track) {
            fetchLyrics(track.artist, track.title);
        } else {
            lyricsContent.textContent = "Selecione uma música para ver a letra.";
        }
    }
});

async function fetchLyrics(artist, title) {
    lyricsContent.textContent = `Buscando letra de "${title}"...`;
    
    try {
        const cleanArtist = artist.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
        
        if (!response.ok) {
            throw new Error('Letra não encontrada');
        }
        
        const data = await response.json();
        
        if (data.lyrics) {
            lyricsContent.textContent = data.lyrics;
        } else {
            lyricsContent.textContent = `Letra de "${title}" ainda não disponível.`;
        }
    } catch (error) {
        console.error('[LYRICS] Erro ao buscar letra:', error);
        lyricsContent.textContent = `Letra de "${title}" ainda não disponível.`;
    }
}

// Toggle Fullscreen
toggleFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
});

// ===== MENU CONTEXTO =====
const contextMenu = document.getElementById("contextMenu");
const moreButtons = document.querySelectorAll(".more-button");
let currentContextTrack = null;

moreButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentContextTrack = tracks[currentTrack];
        if (!currentContextTrack) return;

        if (contextMenu.classList.contains("open")) {
            contextMenu.classList.remove("open");
            return;
        }

        const rect = btn.getBoundingClientRect();
        const menuWidth = Math.min(200, window.innerWidth - 20);
        const menuHeight = 180;

        let top = rect.bottom + 8;
        let left = rect.left;

        if (left + menuWidth > window.innerWidth - 10) {
            left = window.innerWidth - menuWidth - 10;
        }
        if (left < 10) left = 10;

        if (top + menuHeight > window.innerHeight - 10) {
            top = rect.top - menuHeight - 8;
        }
        if (top < 10) top = 10;

        contextMenu.style.top = top + "px";
        contextMenu.style.left = left + "px";
        contextMenu.classList.add("open");

        const favItem = contextMenu.querySelector('[data-action="favorite"]');
        if (currentContextTrack && isFavorite(currentContextTrack.id)) {
            favItem.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11z"/></svg> Remover dos favoritos`;
        } else {
            favItem.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11z"/></svg> Favoritar`;
        }
    });
});

document.addEventListener("click", () => {
    contextMenu.classList.remove("open");
});

contextMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".context-menu-item");
    if (!item || !currentContextTrack) return;

    const action = item.dataset.action;

    if (action === "queue") {
        const track = currentContextTrack;
        const idx = displayList.findIndex((t) => t.id === track.id);
        if (idx !== -1) {
            tracks = [...displayList.slice(idx), ...displayList.slice(0, idx)];
            loadTrack(0, true);
        }
    } else if (action === "favorite") {
        toggleFavorite(currentContextTrack);
        renderFavButtons(tracks[currentTrack]);
    } else if (action === "add-to-playlist") {
        e.stopPropagation();
        showPlaylistSubmenu(currentContextTrack, e);
        contextMenu.classList.remove("open");
        return;
    } else if (action === "share") {
        const url = `https://www.youtube.com/watch?v=${currentContextTrack.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copiado!");
        }).catch(() => {});
    }

    contextMenu.classList.remove("open");
});

// ===== PLAYLIST UI =====
const playlistModal = document.getElementById("playlistModal");
const playlistNameInput = document.getElementById("playlistNameInput");
const playlistCreateBtn = document.getElementById("playlistCreateBtn");
const playlistModalClose = document.getElementById("playlistModalClose");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const playlistSubmenu = document.getElementById("playlistSubmenu");
const userPlaylistsList = document.getElementById("userPlaylistsList");

function showPlaylistSubmenu(track, event) {
    const playlists = getPlaylists();

    if (playlists.length === 0) {
        alert("Crie uma playlist primeiro!");
        return;
    }

    playlistSubmenu.innerHTML = playlists.map(p => {
        const alreadyAdded = isTrackInPlaylist(p.id, track.id);
        return `<button class="playlist-submenu-item" data-playlist-id="${p.id}" ${alreadyAdded ? 'style="opacity:0.5"' : ''}>${escapeHtml(p.name)}${alreadyAdded ? ' (já adicionada)' : ''}</button>`;
    }).join("");

    const rect = event.target.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;

    if (left + 180 > window.innerWidth - 10) {
        left = window.innerWidth - 190;
    }
    if (left < 10) left = 10;

    if (top + (playlists.length * 40 + 12) > window.innerHeight - 10) {
        top = rect.top - (playlists.length * 40 + 20);
    }
    if (top < 10) top = 10;

    playlistSubmenu.style.top = top + "px";
    playlistSubmenu.style.left = left + "px";
    playlistSubmenu.classList.add("open");

    playlistSubmenu.querySelectorAll(".playlist-submenu-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const playlistId = btn.dataset.playlistId;
            const added = addTrackToPlaylist(playlistId, track);
            if (added) {
                const p = getPlaylists().find(p => p.id === playlistId);
                showToast(`Adicionada a "${p ? p.name : "playlist"}"`);
            } else {
                showToast("Música já está nessa playlist");
            }
            playlistSubmenu.classList.remove("open");
            renderUserPlaylists();
        });
    });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        background: "var(--blue)", color: "#fff", padding: "12px 24px",
        borderRadius: "8px", fontSize: ".85rem", fontWeight: "600",
        zIndex: "9999", boxShadow: "0 4px 16px rgba(0,0,0,.4)"
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

playlistCreateBtn.addEventListener("click", () => {
    const name = playlistNameInput.value.trim();
    if (!name) {
        playlistNameInput.style.borderColor = "var(--red)";
        setTimeout(() => { playlistNameInput.style.borderColor = ""; }, 1500);
        return;
    }
    createPlaylist(name);
    playlistModal.classList.remove("open");
    renderUserPlaylists();
    showToast(`Playlist "${name}" criada!`);
});

playlistNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        playlistCreateBtn.click();
    }
});

playlistModalClose.addEventListener("click", () => {
    playlistModal.classList.remove("open");
});

playlistModal.addEventListener("click", (e) => {
    if (e.target === playlistModal) {
        playlistModal.classList.remove("open");
    }
});

createPlaylistBtn.addEventListener("click", () => {
    playlistModal.classList.add("open");
    playlistNameInput.value = "";
    playlistNameInput.focus();
});

document.addEventListener("click", (e) => {
    if (!playlistSubmenu.contains(e.target) && !e.target.closest('[data-action="add-to-playlist"]')) {
        playlistSubmenu.classList.remove("open");
    }
});

function renderUserPlaylists() {
    if (!userPlaylistsList) return;
    const playlists = getPlaylists();

    if (playlists.length === 0) {
        userPlaylistsList.innerHTML = '<p class="playlist-empty-msg">Nenhuma playlist ainda</p>';
        return;
    }

    userPlaylistsList.innerHTML = playlists.map(p => `
        <button class="user-playlist-item" data-playlist-id="${p.id}">
            <svg viewBox="0 0 24 24"><path d="M4 6h12v2H4zm0 5h12v2H4zm0 5h8v2H4zm14-4 4 2.5-4 2.5z"/></svg>
            <span>${escapeHtml(p.name)}</span>
            <span class="playlist-delete" data-delete-id="${p.id}" title="Excluir playlist">&times;</span>
        </button>
    `).join("");

    userPlaylistsList.querySelectorAll(".user-playlist-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (e.target.classList.contains("playlist-delete")) {
                e.stopPropagation();
                const id = e.target.dataset.deleteId;
                const p = getPlaylists().find(p => p.id === id);
                if (p && confirm(`Excluir playlist "${p.name}"?`)) {
                    deletePlaylist(id);
                    renderUserPlaylists();
                    showToast("Playlist excluída");
                }
                return;
            }
            openUserPlaylist(btn.dataset.playlistId);
        });
    });
}

function openUserPlaylist(playlistId) {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (playlist.tracks.length === 0) {
        setHeader(escapeHtml(playlist.name), "Sua playlist", "Nenhuma música ainda.", playlist.name);
        renderStatus("Adicione músicas pelo menu '...' nas músicas.");
        displayList = [];
        isViewingStaticList = true;
        renderPlayer();
        document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
        return;
    }

    setHeader(escapeHtml(playlist.name), "Sua playlist", playlist.tracks.length + " música(s)", playlist.name);
    displayList = [...playlist.tracks];
    isViewingStaticList = true;
    renderCards(displayList);
    renderQueue();
    document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
}

renderUserPlaylists();

// ===== BIBLIOTECA =====
function renderBiblioteca() {
    madeForYou.classList.add("biblioteca-view");
    if (heroSection) heroSection.style.display = "none";
    const shelfHeading = document.querySelector(".section-heading");
    if (shelfHeading) shelfHeading.style.display = "none";
    setHeader("Sua<span>Biblioteca</span>", "Sua coleção", "Músicas e playlists.", "Sua biblioteca");

    const favs = getFavorites();
    const playlists = getPlaylists();

    madeForYou.innerHTML = `
        <button class="biblioteca-list-item" data-bib-action="favoritos">
            <span class="biblioteca-item-icon fav-icon">
                <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11z"/></svg>
            </span>
            <span class="biblioteca-item-info">
                <strong>Músicas Curtidas</strong>
                <small>${favs.length} música${favs.length !== 1 ? 's' : ''}</small>
            </span>
            <svg class="biblioteca-item-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        ${playlists.map(p => `
            <button class="biblioteca-list-item" data-bib-action="playlist" data-playlist-id="${p.id}">
                <span class="biblioteca-item-icon playlist-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h12v2H4zm0 5h12v2H4zm0 5h8v2H4zm14-4 4 2.5-4 2.5z"/></svg>
                </span>
                <span class="biblioteca-item-info">
                    <strong>${escapeHtml(p.name)}</strong>
                    <small>${p.tracks.length} música${p.tracks.length !== 1 ? 's' : ''}</small>
                </span>
                <svg class="biblioteca-item-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `).join('')}
    `;

    madeForYou.querySelector('[data-bib-action="favoritos"]')?.addEventListener('click', () => {
        madeForYou.classList.remove("biblioteca-view");
        if (heroSection) heroSection.style.display = "";
        const shelfHeading = document.querySelector(".section-heading");
        if (shelfHeading) shelfHeading.style.display = "";
        if (!favs.length) {
            setHeader("Músicas<span>Curtidas</span>", "Salvas por você", "Nenhuma música ainda.", "Músicas curtidas");
            renderStatus("Nenhuma música salva ainda. Curta músicas pra preencher aqui.");
            displayList = [];
            isViewingStaticList = true;
            renderPlayer();
            renderQueue();
            return;
        }
        setHeader("Músicas<span>Curtidas</span>", "Salvas por você", `${favs.length} música(s)`, "Músicas curtidas");
        displayList = [...favs];
        isViewingStaticList = true;
        renderCards(displayList);
        renderQueue();
    });

    madeForYou.querySelectorAll('[data-bib-action="playlist"]').forEach(card => {
        card.addEventListener('click', () => {
            madeForYou.classList.remove("biblioteca-view");
            if (heroSection) heroSection.style.display = "";
            const shelfHeading = document.querySelector(".section-heading");
            if (shelfHeading) shelfHeading.style.display = "";
            openUserPlaylist(card.dataset.playlistId);
        });
    });

    displayList = [];
    renderPlayer();
    renderQueue();
}

// ===== AUTENTICACAO (Backend API) =====
const SESSION_KEY = "camadaplay:session_v1";
const TOKEN_KEY = "camadaplay:token_v1";

function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
}

function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

async function apiRegister(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAuthToken(data.token);
    return data;
}

async function apiLogin(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAuthToken(data.token);
    return data;
}

async function apiUpdateProfile(photo) {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ photo })
    });
}

const profileBtn = document.getElementById("profileBtn");
const profileAvatar = document.getElementById("profileAvatar");
const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const profileScreen = document.getElementById("profileScreen");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");
const goToRegister = document.getElementById("goToRegister");
const goToLogin = document.getElementById("goToLogin");
const authGuest = document.getElementById("authGuest");
const authGuest2 = document.getElementById("authGuest2");
const logoutBtn = document.getElementById("logoutBtn");
const profileAvatarLarge = document.getElementById("profileAvatarLarge");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profileUsernameEl = document.getElementById("profileUsername");
const statTotalPlays = document.getElementById("statTotalPlays");
const statTopGenre = document.getElementById("statTopGenre");
const profileTopArtistsList = document.getElementById("profileTopArtistsList");
const userIndicator = document.getElementById("userIndicator");
const userIndicatorAvatar = document.getElementById("userIndicatorAvatar");
const userIndicatorName = document.getElementById("userIndicatorName");
let currentUser = getSession();
migrateStorageToCurrentProfile();
renderUserPlaylists();
sendVisitHeartbeat();
setInterval(sendVisitHeartbeat, 30000);

function showScreen(screen) {
    loginScreen.classList.add("hidden");
    registerScreen.classList.add("hidden");
    profileScreen.classList.add("hidden");
    screen.classList.remove("hidden");
}

function updateProfileUI() {
    if (!currentUser) {
        const userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        profileAvatar.innerHTML = userIcon;
        profileAvatarLarge.innerHTML = userIcon;
        userIndicator.classList.remove("active");
        return;
    }
    const initial = currentUser.username.charAt(0).toUpperCase();
    if (currentUser.photo) {
        profileAvatar.innerHTML = `<img src="${currentUser.photo}" alt="">`;
        profileAvatarLarge.innerHTML = `<img src="${currentUser.photo}" alt="">`;
        userIndicatorAvatar.innerHTML = `<img src="${currentUser.photo}" alt="">`;
    } else {
        profileAvatar.textContent = initial;
        profileAvatarLarge.textContent = initial;
        userIndicatorAvatar.textContent = initial;
    }
    profileUsernameEl.textContent = currentUser.username;
    userIndicatorName.textContent = currentUser.username;
    userIndicator.classList.add("active");
    renderProfileStats();
}

function renderProfileStats() {
    if (!currentUser) return;
    const history = getHistory();

    const totalPlays = history.reduce((sum, h) => sum + (h.count || 1), 0);
    statTotalPlays.textContent = totalPlays;

    const artistCounts = {};
    history.forEach(h => {
        const a = h.artist || "Desconhecido";
        artistCounts[a] = (artistCounts[a] || 0) + (h.count || 1);
    });

    const sorted = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
    statTopGenre.textContent = sorted.length > 0 ? sorted[0][0] : "-";

    profileTopArtistsList.innerHTML = sorted.slice(0, 5).map(([name, plays], i) => `
        <div class="top-artist-item">
            <span class="artist-rank">${i + 1}</span>
            <span class="artist-name">${escapeHtml(name)}</span>
            <span class="artist-plays">${plays}x</span>
        </div>
    `).join("") || '<p style="color:var(--muted);font-size:.85rem;">Nenhum dado ainda</p>';
}

function openAuthModal() {
    authModal.classList.add("open");
    if (currentUser) {
        showScreen(profileScreen);
        updateProfileUI();
    } else {
        showScreen(loginScreen);
    }
}

function closeAuthModal() {
    authModal.classList.remove("open");
    loginError.textContent = "";
    registerError.textContent = "";
}

profileBtn.addEventListener("click", openAuthModal);
if (themeSelect) {
    themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
}
authClose.addEventListener("click", closeAuthModal);
authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthModal();
});

goToRegister.addEventListener("click", () => {
    loginError.textContent = "";
    showScreen(registerScreen);
});

goToLogin.addEventListener("click", () => {
    registerError.textContent = "";
    showScreen(loginScreen);
});

authGuest.addEventListener("click", closeAuthModal);
authGuest2.addEventListener("click", closeAuthModal);

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;

    try {
        const data = await apiLogin(username, password);
        currentUser = { username: data.username, photo: data.photo };
        saveSession(currentUser);
        migrateStorageToCurrentProfile();
        applyProfileVolume();
        updateProfileUI();
        showScreen(profileScreen);
        resetPlayer();
        renderUserPlaylists();
    } catch (err) {
        loginError.textContent = err.message;
    }
});

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value;
    const confirm = document.getElementById("regPassConfirm").value;

    if (username.length < 3) {
        registerError.textContent = "Username precisa de pelo menos 3 caracteres.";
        return;
    }
    if (password.length < 4) {
        registerError.textContent = "Senha precisa de pelo menos 4 caracteres.";
        return;
    }
    if (password !== confirm) {
        registerError.textContent = "As senhas não conferem.";
        return;
    }

    try {
        const data = await apiRegister(username, password);
        currentUser = { username: data.username, photo: data.photo };
        saveSession(currentUser);
        migrateStorageToCurrentProfile();
        applyProfileVolume();
        updateProfileUI();
        showScreen(profileScreen);
        resetPlayer();
        renderUserPlaylists();
    } catch (err) {
        registerError.textContent = err.message;
    }
});

logoutBtn.addEventListener("click", () => {
    currentUser = null;
    clearSession();
    applyProfileVolume();
    updateProfileUI();
    closeAuthModal();

    // Limpar e recarregar como visitante
    displayList = [];
    tracks = [];
    currentTrack = 0;
    playing = false;
    setPlayState(false);
    renderPlayer();
    renderCards([]);
    renderQueue();
    renderUserPlaylists();
    loadView(getRandomQuery());
});

profilePhotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        currentUser.photo = dataUrl;
        saveSession(currentUser);
        apiUpdateProfile(dataUrl);
        updateProfileUI();
    };
    reader.readAsDataURL(file);
});

function resetPlayer() {
    displayList = [];
    tracks = [];
    currentTrack = 0;
    playing = false;
    setPlayState(false);
    renderPlayer();
    renderCards([]);
    renderQueue();
    loadView(getRandomQuery());
}

updateProfileUI();

// ===== BOTAO DOWNLOAD APP (PWA) =====
const downloadBtn = document.getElementById("downloadApp");

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__pwaInstallPrompt = e;
});

async function installPWA() {
    if (window.__pwaInstallPrompt) {
        window.__pwaInstallPrompt.prompt();
        const { outcome } = await window.__pwaInstallPrompt.userChoice;
        console.log("[PWA] Instalação:", outcome);
        window.__pwaInstallPrompt = null;
    } else {
        alert("Para instalar, use o menu do navegador e selecione 'Adicionar à tela inicial'.");
    }
}

function setupDownloadButton() {
    if (!downloadBtn) return;

    if (isStandalone() || !isMobileDevice()) {
        downloadBtn.classList.remove("mobile-visible");
        return;
    }

    downloadBtn.removeAttribute("href");
    downloadBtn.removeAttribute("target");
    downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        installPWA();
    });
    downloadBtn.classList.add("mobile-visible");
}

setupDownloadButton();

// ===== SERVICE WORKER REGISTRATION =====
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

// ===== MODAL TV APP =====
const tvDownloadBtn = document.getElementById("tvDownloadBtn");
const tvModal = document.getElementById("tvModal");
const tvModalClose = document.getElementById("tvModalClose");
const tvDownloadLink = document.getElementById("tvDownloadLink");
const tvQrCode = document.getElementById("tvQrCode");

const TV_APK_URL = window.location.origin + "/camadaplay-tv.apk";

function isTVDevice() {
    const ua = navigator.userAgent || "";
    return /SmartTV|webOS|Tizen|Roku|FireTV|Android TV|HbbTV|NetCast|VIERA|BRAVIA|PlayStation|Xbox/i.test(ua);
}

function setupTvButton() {
    if (!tvDownloadBtn) return;

    if (isTVDevice()) {
        tvDownloadBtn.classList.add("tv-visible");
    } else {
        tvDownloadBtn.classList.remove("tv-visible");
    }
}

function generateTvQrCode() {
    if (!tvQrCode) return;
    const encodedUrl = encodeURIComponent(TV_APK_URL);
    tvQrCode.src = `https://chart.googleapis.com/chart?cht=qr&chs=256x256&chl=${encodedUrl}&choe=UTF-8`;
}

if (tvDownloadBtn && tvModal) {
    tvDownloadBtn.addEventListener("click", () => {
        tvDownloadLink.href = TV_APK_URL;
        generateTvQrCode();
        tvModal.classList.add("open");
    });

    tvModalClose.addEventListener("click", () => {
        tvModal.classList.remove("open");
    });

    tvModal.addEventListener("click", (e) => {
        if (e.target === tvModal) {
            tvModal.classList.remove("open");
        }
    });
}

setupTvButton();
