require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const ACTIVE_VISITOR_TTL = 45 * 1000;
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getDataFile(name) {
    const target = path.join(DATA_DIR, name);
    const legacy = path.join(__dirname, name);

    if (target !== legacy && !fs.existsSync(target) && fs.existsSync(legacy)) {
        fs.copyFileSync(legacy, target);
    }

    return target;
}

// ===== yt-dlp =====
function findYtDlp() {
    if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
    if (os.platform() === 'win32' && process.env.APPDATA) {
        const pythonScripts = path.join(process.env.APPDATA, 'Python');
        if (fs.existsSync(pythonScripts)) {
            const versions = fs.readdirSync(pythonScripts)
                .filter(name => /^Python\d+$/.test(name))
                .sort()
                .reverse();

            for (const version of versions) {
                const candidate = path.join(pythonScripts, version, 'Scripts', 'yt-dlp.exe');
                if (fs.existsSync(candidate)) return candidate;
            }
        }
        return 'yt-dlp.exe';
    }
    return 'yt-dlp';
}
const YTDLP_PATH = findYtDlp();

// ===== CACHE =====
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function getCacheKey(type, query, limit) {
    const hash = crypto.createHash('md5').update(`${type}:${query}:${limit}`).digest('hex');
    return path.join(CACHE_DIR, `${hash}.json`);
}

function getCache(type, query, limit) {
    try {
        const file = getCacheKey(type, query, limit);
        if (!fs.existsSync(file)) return null;
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Date.now() - data.timestamp > CACHE_TTL) {
            fs.unlinkSync(file);
            return null;
        }
        return data.results;
    } catch { return null; }
}

function setCache(type, query, limit, results) {
    try {
        const file = getCacheKey(type, query, limit);
        fs.writeFileSync(file, JSON.stringify({ timestamp: Date.now(), results }));
    } catch {}
}

// ===== USUARIOS (JSON file) =====
const USERS_FILE = getDataFile('.users.json');

function loadUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return {}; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getBearerToken(req) {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function createSession(users, username) {
    const token = crypto.randomUUID();
    users[username].token = token;
    users[username].tokenCreatedAt = Date.now();
    saveUsers(users);
    return token;
}

function findUserByToken(token) {
    if (!token) return null;

    const users = loadUsers();
    const entry = Object.entries(users).find(([, data]) => data.token === token);
    if (!entry) return null;

    const [username, user] = entry;
    return { username, user, users };
}

function requireUser(req, res, username = null) {
    const token = getBearerToken(req);
    const session = findUserByToken(token);

    if (!session) {
        res.status(401).json({ error: 'Não autenticado.' });
        return null;
    }

    if (username && session.username !== username) {
        res.status(403).json({ error: 'Você não tem permissão para acessar esse usuário.' });
        return null;
    }

    return session;
}

// ===== PLAYLISTS (JSON file) =====
const PLAYLISTS_FILE = getDataFile('.playlists.json');

function loadPlaylists() {
    try { return JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf8')); }
    catch { return {}; }
}

function savePlaylists(data) {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(data, null, 2));
}

// ===== VISIT STATS =====
const VISITORS_FILE = getDataFile('.visitors.json');
const COUNTERS_FILE = getDataFile('.counters.json');
const activeVisitors = new Map();
const VISITOR_COOKIE = 'camadaplay_visitor_id';

function parseCookies(req) {
    return String(req.headers.cookie || '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .reduce((cookies, item) => {
            const index = item.indexOf('=');
            if (index === -1) return cookies;
            const key = decodeURIComponent(item.slice(0, index).trim());
            const value = decodeURIComponent(item.slice(index + 1).trim());
            cookies[key] = value;
            return cookies;
        }, {});
}

function createVisitorId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function normalizeVisitorId(value) {
    const visitorId = String(value || '').trim();
    return visitorId && visitorId.length <= 80 ? visitorId : '';
}

function setVisitorCookie(res, visitorId) {
    res.cookie(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 365
    });
}

function loadVisitors() {
    try {
        const data = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8'));
        return data && typeof data === 'object' && data.visitors ? data : { visitors: {} };
    } catch {
        return { visitors: {} };
    }
}

function saveVisitors(data) {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(data, null, 2));
}

function loadCounters() {
    try {
        return JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
    } catch {
        return { totalVisits: 0, uniqueDevices: 0 };
    }
}

function saveCounters(data) {
    fs.writeFileSync(COUNTERS_FILE, JSON.stringify(data, null, 2));
}

function pruneActiveVisitors() {
    const now = Date.now();
    for (const [id, lastSeen] of activeVisitors.entries()) {
        if (now - lastSeen > ACTIVE_VISITOR_TTL) {
            activeVisitors.delete(id);
        }
    }
}

function getVisitStats() {
    pruneActiveVisitors();
    const usersTotal = Object.keys(loadUsers()).length;
    const visitorsTotal = Object.keys(loadVisitors().visitors).length;
    const counters = loadCounters();

    return {
        total: counters.totalVisits || usersTotal + visitorsTotal,
        active: activeVisitors.size,
        users: usersTotal,
        visitors: visitorsTotal,
        uniqueDevices: counters.uniqueDevices || visitorsTotal
    };
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname, { dotfiles: 'deny' }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CamadaPlay.html');
});

app.post('/api/stats/visit', (req, res) => {
    const cookies = parseCookies(req);
    const cookieVisitorId = normalizeVisitorId(cookies[VISITOR_COOKIE]);
    const bodyVisitorId = normalizeVisitorId(req.body?.visitorId);
    const visitorId = cookieVisitorId || bodyVisitorId || createVisitorId();
    const username = String(req.body?.username || '').trim();
    const clientFirstVisit = Number(req.body?.firstVisit) || 0;
    const clientTotalVisits = Number(req.body?.totalVisits) || 0;
    const clientUniqueDevices = Number(req.body?.uniqueDevices) || 0;

    if (!visitorId || visitorId.length > 80) {
        return res.status(400).json({ error: 'Visitante inválido.' });
    }

    setVisitorCookie(res, visitorId);

    const visitorsData = loadVisitors();
    const users = loadUsers();
    const counters = loadCounters();
    const now = Date.now();
    const activeId = username && users[username] ? `user:${username}` : `visitor:${visitorId}`;

    if (username && users[username]) {
        delete visitorsData.visitors[visitorId];
    } else {
        if (!visitorsData.visitors[visitorId]) {
            const firstSeen = clientFirstVisit && clientFirstVisit < now ? clientFirstVisit : now;
            visitorsData.visitors[visitorId] = { firstSeen, lastSeen: now };
        } else {
            visitorsData.visitors[visitorId].lastSeen = now;
            if (clientFirstVisit && clientFirstVisit < visitorsData.visitors[visitorId].firstSeen) {
                visitorsData.visitors[visitorId].firstSeen = clientFirstVisit;
            }
        }
    }

    saveVisitors(visitorsData);

    if (clientTotalVisits === 0) {
        counters.totalVisits += 1;
    } else if (clientTotalVisits > counters.totalVisits) {
        counters.totalVisits = clientTotalVisits;
    }

    const currentUniqueDevices = Object.keys(visitorsData.visitors).length;
    counters.uniqueDevices = Math.max(counters.uniqueDevices, currentUniqueDevices, clientUniqueDevices);

    saveCounters(counters);

    activeVisitors.set(activeId, now);
    res.json(getVisitStats());
});

app.get('/api/stats', (req, res) => {
    res.json(getVisitStats());
});

// ===== YT-DLP SEARCH =====
function ytDlpSearch(query, limit = 12) {
    return new Promise((resolve, reject) => {
        const cached = getCache('search', query, limit);
        if (cached) {
            console.log(`[CACHE] Hit para busca: "${query}"`);
            return resolve(cached);
        }

        const args = [
            `ytsearch${limit}:${query}`,
            '--flat-playlist',
            '--no-download',
            '--print', '%(id)s|||%(title)s|||%(channel)s',
            '--no-warnings'
        ];

        console.log(`[YT-DLP] Buscando: "${query}", limite: ${limit}`);

        execFile(YTDLP_PATH, args, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error && !stdout) {
                console.error('[YT-DLP] Erro:', error.message);
                return reject(new Error('Falha ao buscar vídeos.'));
            }

            const lines = stdout.trim().split('\n').filter(Boolean);
            const results = lines.map(line => {
                const [id, title, artist] = line.split('|||');
                const thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
                return {
                    id: id || '',
                    title: title || 'Sem título',
                    artist: artist || 'Desconhecido',
                    thumbnail,
                    description: ''
                };
            }).filter(item => item.id);

            console.log(`[YT-DLP] ${results.length} resultados encontrados`);
            setCache('search', query, limit, results);
            resolve(results);
        });
    });
}

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username precisa de pelo menos 3 caracteres.' });
    }
    if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Senha precisa de pelo menos 4 caracteres.' });
    }

    const users = loadUsers();
    if (users[username]) {
        return res.status(409).json({ error: 'Esse username ja existe.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    users[username] = { password: hashed, photo: null, createdAt: Date.now() };
    const token = createSession(users, username);
    res.json({ token, username, photo: null });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const users = loadUsers();
    const user = users[username];

    if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = createSession(users, username);
    res.json({ token, username, photo: user.photo });
});

app.put('/api/auth/profile', (req, res) => {
    const { photo } = req.body;
    const session = requireUser(req, res);
    if (!session) return;

    if (photo !== undefined) session.users[session.username].photo = photo;
    saveUsers(session.users);

    res.json({ username: session.username, photo: session.users[session.username].photo });
});

// ===== PLAYLIST ROUTES =====
app.get('/api/playlists/:username', (req, res) => {
    const session = requireUser(req, res, req.params.username);
    if (!session) return;

    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    res.json({ playlists: userPlaylists });
});

app.post('/api/playlists', (req, res) => {
    const { username, name, tracks } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Dados invalidos.' });
    const session = requireUser(req, res, username);
    if (!session) return;

    const allPlaylists = loadPlaylists();
    if (!allPlaylists[username]) allPlaylists[username] = [];

    const playlist = {
        id: crypto.randomUUID(),
        name,
        tracks: tracks || [],
        createdAt: Date.now()
    };

    allPlaylists[username].push(playlist);
    savePlaylists(allPlaylists);

    res.json({ playlist });
});

app.delete('/api/playlists/:username/:playlistId', (req, res) => {
    const session = requireUser(req, res, req.params.username);
    if (!session) return;

    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    allPlaylists[req.params.username] = userPlaylists.filter(p => p.id !== req.params.playlistId);
    savePlaylists(allPlaylists);

    res.json({ ok: true });
});

app.put('/api/playlists/:username/:playlistId', (req, res) => {
    const session = requireUser(req, res, req.params.username);
    if (!session) return;

    const { name, tracks } = req.body;
    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    const playlist = userPlaylists.find(p => p.id === req.params.playlistId);

    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });

    if (name !== undefined) playlist.name = name;
    if (tracks !== undefined) playlist.tracks = tracks;

    savePlaylists(allPlaylists);
    res.json({ playlist });
});

// ===== SEARCH =====
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const limit = parseInt(req.query.limit, 10) || 12;

    console.log(`[SEARCH] Requisicao - query: "${query}", limit: ${limit}`);

    if (!query) {
        return res.status(400).json({ error: 'Parâmetro "q" obrigatório.' });
    }

    try {
        const results = await ytDlpSearch(query, limit);
        console.log(`[SEARCH] Enviando ${results.length} resultados`);
        res.json({ results, nextPageToken: '' });
    } catch (error) {
        console.error('[SEARCH] Erro:', error.message);
        res.status(500).json({ error: 'Falha ao buscar vídeos.' });
    }
});

// ===== RECOMMENDATIONS =====
app.get('/api/recommend', async (req, res) => {
    const artists = req.query.artists;
    const titles = req.query.titles;
    const searches = req.query.searches;
    const categories = req.query.categories;
    const seeds = req.query.seeds;
    const limit = parseInt(req.query.limit, 10) || 12;

    console.log(`[RECOMMEND] artists: "${artists}", titles: "${titles}", searches: "${searches}", categories: "${categories}", seeds: "${seeds}"`);

    try {
        let queries = [];
        const cleanSignal = (value) => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s'-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const addQuery = (query) => {
            const clean = cleanSignal(query);
            if (clean && !queries.includes(clean)) queries.push(clean);
        };

        if (artists) {
            artists.split(',').filter(Boolean).slice(0, 5).forEach(artist => {
                const name = artist.trim();
                addQuery(`${name} melhores músicas`);
                addQuery(`${name} músicas parecidas`);
                addQuery(`${name} playlist`);
            });
        }

        if (titles) {
            titles.split(',').filter(Boolean).slice(0, 4).forEach(title => {
                const name = title.trim();
                addQuery(`${name} músicas parecidas`);
                addQuery(`${name} radio`);
            });
        }

        if (categories) {
            categories.split(',').filter(Boolean).slice(0, 4).forEach(category => {
                const name = category.trim();
                addQuery(`${name} músicas mais tocadas`);
                addQuery(`${name} playlist atualizada`);
                addQuery(`${name} hits`);
            });
        }

        if (searches) {
            searches.split(',').filter(Boolean).slice(0, 5).forEach(search => {
                const name = search.trim();
                addQuery(`${name} músicas`);
                addQuery(`${name} playlist`);
            });
        }

        if (seeds) {
            seeds.split(',').filter(Boolean).slice(0, 6).forEach(seed => {
                addQuery(`${seed.trim()} music`);
            });
        }

        if (queries.length === 0) {
            queries = [
                'Taylor Swift The Weeknd Dua Lipa Bruno Mars hits',
                'Bad Bunny Karol G Anitta J Balvin reggaeton latin hits',
                'Kendrick Lamar Drake Travis Scott Kanye West rap hits',
                'Ana Castela Gusttavo Lima Henrique e Juliano sertanejo hits',
                'Anitta Luisa Sonza Pabllo Vittar Ludmilla pop brasileiro',
                'BTS BLACKPINK NewJeans Stray Kids kpop hits',
                'Arctic Monkeys Foo Fighters Linkin Park Nirvana rock hits',
                'Calvin Harris David Guetta Alan Walker Avicii EDM hits',
                'Racionais MCs Djonga BK Emicida rap nacional',
                'Tom Jobim Caetano Veloso Gilberto Gil Chico Buarque MPB'
            ];
        }

        const allResults = [];
        const seenIds = new Set();

        for (const query of queries) {
            if (allResults.length >= limit) break;
            try {
                const results = await ytDlpSearch(query, 8);
                for (const item of results) {
                    if (!seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        allResults.push(item);
                        if (allResults.length >= limit) break;
                    }
                }
            } catch (e) {
                console.warn(`[RECOMMEND] Erro na query "${query}":`, e.message);
            }
        }

        console.log(`[RECOMMEND] ${allResults.length} recomendações`);
        res.json({ results: allResults.slice(0, limit) });
    } catch (error) {
        console.error('[RECOMMEND] Erro:', error.message);
        res.status(500).json({ error: 'Falha ao buscar recomendações.' });
    }
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  CamadaPlay rodando em http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`[OK] yt-dlp: ${YTDLP_PATH}`);
    console.log(`[OK] Node.js ${process.version}`);
    console.log(`[OK] Cache: ativo (TTL: ${CACHE_TTL / 1000}s)`);
    console.log(`[OK] Auth: bcrypt + file storage\n`);
});
