require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

function findYtDlp() {
    if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
    if (os.platform() === 'win32') {
        return path.join(process.env.APPDATA, 'Python', 'Python314', 'Scripts', 'yt-dlp.exe');
    }
    return 'yt-dlp';
}
const YTDLP_PATH = findYtDlp();

app.use(cors());
app.use(express.static(__dirname, { dotfiles: 'deny' }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CamadaPlay.html');
});

function ytDlpSearch(query, limit = 12) {
    return new Promise((resolve, reject) => {
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
            resolve(results);
        });
    });
}

// Rota de busca
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const limit = parseInt(req.query.limit, 10) || 12;

    console.log(`[SEARCH] Requisicao recebida - query: "${query}", limit: ${limit}`);

    if (!query) {
        console.warn('[SEARCH] Parametro "q" ausente.');
        return res.status(400).json({ error: 'Parametro "q" obrigatorio.' });
    }

    try {
        const results = await ytDlpSearch(query, limit);
        console.log(`[SEARCH] Enviando ${results.length} resultados ao cliente`);
        res.json({ results, nextPageToken: '' });
    } catch (error) {
        console.error('[SEARCH] Erro na busca:', error.message);
        res.status(500).json({ error: 'Falha ao buscar videos.' });
    }
});

// Rota de recomendacoes baseada no historico
app.get('/api/recommend', async (req, res) => {
    const artists = req.query.artists;
    const titles = req.query.titles;
    const searches = req.query.searches;
    const limit = parseInt(req.query.limit, 10) || 12;

    console.log(`[RECOMMEND] Requisicao - artists: "${artists}", titles: "${titles}", searches: "${searches}", limit: ${limit}`);

    try {
        let queries = [];
        if (artists) {
            const artistList = artists.split(',').filter(Boolean).slice(0, 3);
            artistList.forEach(artist => {
                const name = artist.trim();
                queries.push(`${name} music video official`);
                queries.push(`${name} playlist`);
            });
        }
        if (titles) {
            const titleList = titles.split(',').filter(Boolean).slice(0, 3);
            titleList.forEach(title => {
                const name = title.trim();
                queries.push(`${name} official video`);
            });
        }
        if (searches) {
            const searchList = searches.split(',').filter(Boolean).slice(0, 3);
            searchList.forEach(search => {
                const term = search.trim();
                queries.push(`${term} music hits`);
                queries.push(`${term} top music`);
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
                    }
                }
            } catch (e) {
                console.warn(`[RECOMMEND] Erro na query "${query}":`, e.message);
            }
        }

        console.log(`[RECOMMEND] Enviando ${allResults.length} recomendacoes`);
        res.json({ results: allResults.slice(0, limit) });
    } catch (error) {
        console.error('[RECOMMEND] Erro na recomendacao:', error.message);
        res.status(500).json({ error: 'Falha ao buscar recomendacoes.' });
    }
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  CamadaPlay rodando em http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`[OK] yt-dlp: ${YTDLP_PATH}`);
    console.log(`[OK] Node.js ${process.version}`);
    console.log(`[OK] Modo: yt-dlp (sem limite de API)\n`);
});
