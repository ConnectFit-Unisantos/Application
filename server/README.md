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
| POST | `/api/auth/register` | Cadastro de conta (inicia como `aluno`). Retorna `{ token, user }`. |
| POST | `/api/auth/login` | Login. Retorna `{ token, user }`. |
| GET | `/api/auth/me` | Usuário logado (protegida por JWT). Retorna 401 se o usuário não existir mais. |

### Personal
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/personals` | Lista de personais (pública). |
| POST | `/api/auth/personal/activate` | Ativa/atualiza perfil de personal (protegida por JWT). Retorna `{ token, user }` com token novo (`tipo: personal`). |

### Agendamento (`/api/agendamentos`)
| Método | Rota | Quem | Descrição |
|---|---|---|---|
| GET | `/personal/:personalId/disponibilidade?inicio=&fim=` | público | Horários livres do personal por dia (já desconta ocupados, passados e folgas). |
| GET | `/disponibilidade` | personal | Agenda semanal + datas bloqueadas do personal logado. |
| PUT | `/disponibilidade` | personal | Salva `{ semana: [{ diaSemana, horarios }], datasBloqueadas }`. |
| POST | `/` | aluno | Solicita aula `{ personalId, data, horario, observacao? }` → status `pendente`. |
| GET | `/?escopo=proximas\|historico\|todas` | logado | Aulas do usuário (como aluno ou personal, conforme o tipo da conta). |
| GET | `/:id` | participante | Detalhe da aula. |
| PATCH | `/:id/confirmar` | personal | Confirma solicitação pendente. |
| PATCH | `/:id/recusar` | personal | Recusa solicitação `{ motivo? }` e libera o horário. |
| PATCH | `/:id/cancelar` | participante | Cancela `{ motivo? }` (regras abaixo). |

Regras: horário precisa estar na agenda do personal, no futuro (mín. 30 min) e em até 60 dias; um personal/aluno não pode ter duas aulas ativas no mesmo horário (índice único no banco). Aluno cancela pendente a qualquer momento e confirmada até 2h antes; personal cancela confirmada até o início. Pendentes não respondidas até o horário viram canceladas; confirmadas viram concluídas após o término.

### Chat (`/api/chat`, todas exigem login)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/conversas` | Conversas do usuário, mais recentes primeiro, com não lidas. |
| POST | `/conversas` | Abre/retoma conversa: aluno envia `{ personalId }`; personal envia `{ alunoId }` (só alunos que agendaram com ele). |
| GET | `/conversas/:id` | Dados da conversa (só participantes). |
| GET | `/conversas/:id/mensagens?antes=ISO` | Histórico paginado (marca como lida). |
| POST | `/conversas/:id/mensagens` | Envia `{ texto }` (até 2000 caracteres). |
| POST | `/conversas/:id/lida` | Marca como lida. |
| GET | `/nao-lidas` | Total de mensagens não lidas. |

### Tempo real (Socket.IO, mesma porta da API)
Conecte com `auth: { token }`. Eventos recebidos: `mensagem:nova`, `conversa:atualizada`, `agendamento:atualizado` — enviados somente aos participantes.

Erros de validação retornam **400** com:
```json
{ "message": "Informe um e-mail válido (ex: nome@email.com)", "fields": { "email": "..." }, "issues": [ ... ] }
```

> Observação: o prefixo de rotas do servidor é montado em `src/app.ts`.

---

## Como rodar localmente

```bash
cd server
npm install
cp .env.example .env   # no Windows: copy .env.example .env
# edite o .env e troque <db_password> pela senha do banco
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

