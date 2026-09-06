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

// ===== yt-dlp =====
function findYtDlp() {
    if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
    if (os.platform() === 'win32') {
        return path.join(process.env.APPDATA, 'Python', 'Python314', 'Scripts', 'yt-dlp.exe');
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
const USERS_FILE = path.join(__dirname, '.users.json');

function loadUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return {}; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== PLAYLISTS (JSON file) =====
const PLAYLISTS_FILE = path.join(__dirname, '.playlists.json');

function loadPlaylists() {
    try { return JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf8')); }
    catch { return {}; }
}

function savePlaylists(data) {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(data, null, 2));
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname, { dotfiles: 'deny' }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CamadaPlay.html');
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
                return reject(new Error('Falha ao buscar videos.'));
            }

            const lines = stdout.trim().split('\n').filter(Boolean);
            const results = lines.map(line => {
                const [id, title, artist] = line.split('|||');
                const thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
                return {
                    id: id || '',
                    title: title || 'Sem titulo',
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
    saveUsers(users);

    const token = crypto.randomUUID();
    res.json({ token, username, photo: null });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const users = loadUsers();
    const user = users[username];

    if (!user) {
        return res.status(401).json({ error: 'Usuario nao encontrado.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = crypto.randomUUID();
    res.json({ token, username, photo: user.photo });
});

app.put('/api/auth/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Nao autenticado.' });

    const { photo } = req.body;
    const users = loadUsers();

    // Encontrar usuario pelo token (simplificado - em producao usar JWT)
    let foundUser = null;
    for (const [name, data] of Object.entries(users)) {
        if (data.token === token) {
            foundUser = name;
            break;
        }
    }

    if (!foundUser) return res.status(401).json({ error: 'Token invalido.' });

    if (photo !== undefined) users[foundUser].photo = photo;
    saveUsers(users);

    res.json({ username: foundUser, photo: users[foundUser].photo });
});

// ===== PLAYLIST ROUTES =====
app.get('/api/playlists/:username', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Nao autenticado.' });

    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    res.json({ playlists: userPlaylists });
});

app.post('/api/playlists', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Nao autenticado.' });

    const { username, name, tracks } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Dados invalidos.' });

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
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Nao autenticado.' });

    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    allPlaylists[req.params.username] = userPlaylists.filter(p => p.id !== req.params.playlistId);
    savePlaylists(allPlaylists);

    res.json({ ok: true });
});

app.put('/api/playlists/:username/:playlistId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Nao autenticado.' });

    const { name, tracks } = req.body;
    const allPlaylists = loadPlaylists();
    const userPlaylists = allPlaylists[req.params.username] || [];
    const playlist = userPlaylists.find(p => p.id === req.params.playlistId);

    if (!playlist) return res.status(404).json({ error: 'Playlist nao encontrada.' });

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
        return res.status(400).json({ error: 'Parametro "q" obrigatorio.' });
    }

    try {
        const results = await ytDlpSearch(query, limit);
        console.log(`[SEARCH] Enviando ${results.length} resultados`);
        res.json({ results, nextPageToken: '' });
    } catch (error) {
        console.error('[SEARCH] Erro:', error.message);
        res.status(500).json({ error: 'Falha ao buscar videos.' });
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
        const addQuery = (query) => {
            const clean = String(query || '').trim();
            if (clean && !queries.includes(clean)) queries.push(clean);
        };

        if (categories) {
            categories.split(',').filter(Boolean).slice(0, 4).forEach(category => {
                const name = category.trim();
                addQuery(`${name} musicas mais tocadas`);
                addQuery(`${name} playlist atualizada`);
                addQuery(`${name} hits`);
            });
        }

        if (artists) {
            artists.split(',').filter(Boolean).slice(0, 5).forEach(artist => {
                const name = artist.trim();
                addQuery(`${name} melhores musicas`);
                addQuery(`${name} musicas parecidas`);
                addQuery(`${name} playlist`);
            });
        }

        if (titles) {
            titles.split(',').filter(Boolean).slice(0, 4).forEach(title => {
                const name = title.trim();
                addQuery(`${name} musicas parecidas`);
                addQuery(`${name} radio`);
            });
        }

        if (searches) {
            searches.split(',').filter(Boolean).slice(0, 5).forEach(search => {
                const name = search.trim();
                addQuery(`${name} musicas`);
                addQuery(`${name} playlist`);
            });
        }

        if (seeds) {
            seeds.split(',').filter(Boolean).slice(0, 6).forEach(seed => {
                addQuery(`${seed.trim()} music`);
            });
        }

        if (queries.length === 0) {
            queries = ['music hits 2024', 'top music today', 'new music release'];
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

        console.log(`[RECOMMEND] ${allResults.length} recomendacoes`);
        res.json({ results: allResults.slice(0, limit) });
    } catch (error) {
        console.error('[RECOMMEND] Erro:', error.message);
        res.status(500).json({ error: 'Falha ao buscar recomendacoes.' });
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
