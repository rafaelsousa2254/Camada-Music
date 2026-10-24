# CamadaPlay - Player de Música

O CamadaPlay é um player de música web que permite buscar músicas do YouTube, criar e gerenciar playlists, e ouvir áudio em background. A aplicação foi construída com Node.js e Express, usando yt-dlp para busca e streaming de áudio.

## Funcionalidades

- **Autenticação de usuários**: Registro e login com bcrypt
- **Busca de músicas**: Pesquisa no YouTube via yt-dlp
- **Playlists**: Criar, editar e excluir playlists personalizadas
- **Streaming de áudio**: Tocar músicas com proxy de áudio
- **Estatísticas**: Contador de visitas e usuários ativos
- **Cache**: Cache de busca por 10 minutos

## Tecnologias

- Node.js + Express
- yt-dlp (para busca e streaming de áudio do YouTube)
- bcrypt (hash de senhas)
- CORS, dotenv

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Copie o .env e ajuste se necessário
cp .env.example .env  # (se existir) ou edite .manual

# 3. Certifique-se de que o yt-dlp está disponível:
# - No Windows: pode ser baixado de https://github.com/yt-dlp/yt-dlp/releases
# - Ou configure YTDLP_PATH no .env

# 4. Iniciar o servidor
npm start
# ou: node server.js

# O servidor rodará em http://localhost:3000
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |
| `YTDLP_PATH` | Caminho para yt-dlp.exe | automático |
| `DATA_DIR` | Diretório para dados JSON | auto-detectado |

## Endpoints Principais

- `GET /` - Página inicial
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/search` - Buscar músicas (`?q=query`)
- `GET /api/recommend` - Recomendações de músicas
- `GET /api/playlists/:username` - Listar playlists do usuário
- `POST /api/playlists` - Criar nova playlist
- `GET /api/stream/:videoId` - Stream de áudio

## Estrutura de Dados

Os dados são persistidos em arquivos JSON na pasta raiz:
- `.users.json` - Credenciais de usuários
- `.playlists.json` - Playlists criadas
- `.visitors.json` - Estatísticas de visitantes
- `.counters.json` - Contadores de visitas

## Licença

MIT
