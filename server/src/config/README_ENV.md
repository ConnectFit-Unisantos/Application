# Variáveis de Ambiente - ConnectFit (server)

As variáveis abaixo são esperadas pelo backend.

## Obrigatórias
- `PORT` (number > 0)
- `MONGODB_URI` (string)
- `JWT_SECRET` (string)

## Opcionais
- `JWT_EXPIRES_IN` (default: `7d`)
- `CORS_ORIGIN` (quando não definido, o backend mantém `origin: true` conforme comportamento anterior)

## Observação
- O backend usa `dotenv/config`, então ao iniciar via `npm run dev` com `.env` presente, os valores serão carregados.

