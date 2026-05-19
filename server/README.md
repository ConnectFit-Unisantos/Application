# connectfit-server

Backend Node.js + TypeScript para a plataforma ConnectFit.

## Endpoints

- `POST /api/auth/register`
  - Cadastro de conta (sempre inicia como `aluno`)
- `POST /api/auth/login`

## Rodar local

```bash
npm install
cp .env.example .env
npm run dev
```

## Variáveis de ambiente

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`

