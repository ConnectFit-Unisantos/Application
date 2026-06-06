# ConnectFit - Backend

Backend em **Node.js + TypeScript** para o aplicativo **ConnectFit**.

Este serviço expõe uma **API REST** com autenticação por **JWT**, validação de payload com **Zod** e persistência em **MongoDB** via **Mongoose**.

**LEMBRANDO** - Para fazer o teste do projeto com esse código é necessário um .env gerado pelo [MongoDB](https://www.mongodb.com), caso você não tenha um cadastro, basta criar uma conta, criar um cluster e seguir o passo a passo, o seu arquivo deve ficar como o .env.example

---

## Estrutura (alto nível)

- `src/routes/` — rotas HTTP (ex.: autenticação e dados de personal)
- `src/controllers/` — handlers das rotas
- `src/services/` — regras de negócio (ex.: ativação do personal)
- `src/middlewares/` — `requireAuth` (JWT) e `errorHandler` (erros centralizados)
- `src/models/` — schema Mongoose (`User`)
- `src/validators/` — validação de entrada com Zod

---

## Endpoints

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro de conta (inicia como `aluno`). |
| POST | `/api/auth/login` | Login e retorno de `token` + `user`. |

### Personal
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/personals` | Lista de personais (pública). |
| POST | `/api/auth/personal/activate` | Ativa/atualiza perfil de personal (protegida por JWT). |

> Observação: o prefixo de rotas do servidor é montado em `src/app.ts`.

---

## Como rodar localmente

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

---

## Variáveis de ambiente

Veja também `src/config/README_ENV.md`.

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (opcional)
- `CORS_ORIGIN` (opcional)

---

## Saúde

- `GET /health` → retorna `{ ok: true }`

