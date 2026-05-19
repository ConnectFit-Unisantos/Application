# ConnectFit

> Plataforma que conecta alunos a personal trainers qualificados de forma prática e eficiente.

---

## Visão Geral

ConnectFit é uma aplicação web que permite que alunos encontrem, filtrem e contratem personal trainers de acordo com especialidade, localização e avaliações. Personal trainers podem criar perfis, definir preços e gerenciar agendamentos.

### Métricas-alvo da plataforma
- 500+ Personal Trainers cadastrados
- 10.000+ Alunos satisfeitos
- 98% de taxa de satisfação

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + TypeScript |
| Backend | Node.js + TypeScript |
| Banco de dados | MongoDB |
| Comunicação | REST API (HTTPS / JSON) |
| Notificações | E-mail + Push Notifications (serviço externo) |

---

## Arquitetura

```
Cliente (Web/Mobile)
        │
        │ HTTPS / REST / JSON
        ▼
Servidor de Aplicação (Node.js + TypeScript)
  ├── Autenticação
  ├── Gerenciamento de Perfis
  └── Agendamentos
        │
        ▼
Banco de Dados (MongoDB)
  ├── Perfis de Usuários
  ├── Imagens
  └── Agendamentos
        │
        ▼
Serviços Externos
  ├── E-mail
  └── Push Notifications
```

---

## Funcionalidades

### Página Principal (Landing)
- Header com logo **ConnectFit** e botão **"Seja um Personal"**
- Hero section com título e subtítulo de apresentação
- Cards de métricas: Personal Trainers, Alunos Satisfeitos, Taxa de Satisfação
- Barra de busca de personal trainers por nome ou especialidade
- Filtros por **especialidade** e **localização** com opção de limpar filtros
- Grid de cards de trainers disponíveis (ex: "6 Personals Disponíveis")

### Card de Personal Trainer
Cada card exibe:
- Foto de capa (imagem representativa da especialidade)
- Nome do trainer
- Ícone de certificação/badge
- Localização (cidade - estado)
- Tags de especialidades (ex: Musculação, Emagrecimento, Hipertrofia)
- Avaliação com estrelas + número de avaliações entre parênteses
- Preço por hora em R$

### Perfil do Personal Trainer
- Foto e dados pessoais
- Especialidades detalhadas
- Avaliações e comentários de alunos
- Calendário de disponibilidade
- Botão de contato/agendamento

### Área do Personal Trainer ("Seja um Personal")
- Cadastro de perfil profissional
- Upload de foto
- Definição de especialidades, localização e preço
- Gerenciamento de agendamentos

### Autenticação
- Cadastro e login para alunos e personal trainers
- Fluxos separados por tipo de usuário
- Autenticação segura (JWT ou similar)

---

## Modelos de Dados (MongoDB)

### Usuário / Aluno
```json
{
  "_id": "ObjectId",
  "nome": "string",
  "email": "string",
  "senha": "string (hash)",
  "tipo": "aluno | personal",
  "criadoEm": "Date"
}
```

### Personal Trainer
```json
{
  "_id": "ObjectId",
  "usuarioId": "ObjectId",
  "nome": "string",
  "foto": "string (URL)",
  "localizacao": {
    "cidade": "string",
    "estado": "string"
  },
  "especialidades": ["string"],
  "precoPorHora": "number",
  "avaliacao": {
    "media": "number",
    "totalAvaliacoes": "number"
  },
  "certificado": "boolean",
  "bio": "string"
}
```

### Agendamento
```json
{
  "_id": "ObjectId",
  "alunoId": "ObjectId",
  "personalId": "ObjectId",
  "dataHora": "Date",
  "status": "pendente | confirmado | cancelado | concluido",
  "criadoEm": "Date"
}
```

### Avaliação
```json
{
  "_id": "ObjectId",
  "alunoId": "ObjectId",
  "personalId": "ObjectId",
  "nota": "number (1-5)",
  "comentario": "string",
  "criadoEm": "Date"
}
```

---

## Endpoints REST (API)

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login |

### Personal Trainers
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/trainers` | Listar trainers (com filtros) |
| GET | `/api/trainers/:id` | Perfil de um trainer |
| POST | `/api/trainers` | Criar perfil de trainer |
| PUT | `/api/trainers/:id` | Atualizar perfil |

**Query params para listagem:**
- `busca` — texto livre (nome ou especialidade)
- `especialidade` — filtrar por especialidade
- `localizacao` — filtrar por cidade/estado

### Agendamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/agendamentos` | Listar agendamentos do usuário |
| POST | `/api/agendamentos` | Criar agendamento |
| PUT | `/api/agendamentos/:id` | Atualizar status |

### Avaliações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/trainers/:id/avaliacoes` | Listar avaliações de um trainer |
| POST | `/api/avaliacoes` | Enviar avaliação |

---

## Design & UI

### Identidade Visual (baseada nos mockups)
- **Paleta**: Fundo preto/dark no header, fundo cinza claro `#f3f3f3` no corpo, branco nos cards
- **Tipografia**: Bold e pesada para títulos; regular para textos descritivos
- **Logo**: Ícone geométrico + "ConnectFit" em branco sobre fundo preto
- **Botões**: Estilo pill/rounded; botão primário em branco com borda preta; limpo e sem gradientes

### Componentes principais
- `Navbar` — Logo à esquerda, botão "Seja um Personal" à direita
- `HeroSection` — Título grande, subtítulo, sem imagem de fundo
- `MetricCard` — Ícone + número em negrito + label descritivo
- `SearchBar` — Campo de busca com ícone de lupa, borda arredondada
- `FilterBar` — Dropdowns de especialidade e localização + botão "Limpar Filtros"
- `TrainerCard` — Foto grande + informações abaixo: nome, badge, localização, tags, rating, preço
- `TagBadge` — Pílula cinza com texto da especialidade

### Layout do grid de cards
- 3 colunas em desktop
- 2 colunas em tablet
- 1 coluna em mobile

---

## Estrutura de Pastas (Sugerida)

```
connectfit/
├── client/                  # Frontend React
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── HeroSection.tsx
│       │   ├── MetricCard.tsx
│       │   ├── SearchBar.tsx
│       │   ├── FilterBar.tsx
│       │   └── TrainerCard.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── TrainerProfile.tsx
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── services/        # Chamadas à API
│       └── App.tsx
│
└── server/                  # Backend Node.js
    └── src/
        ├── controllers/
        ├── models/
        ├── routes/
        ├── middlewares/
        ├── services/        # Notificações, etc.
        └── app.ts
```

---

## Dados de Exemplo (Seed)

Os seguintes trainers devem estar disponíveis no seed inicial:

| Nome | Localização | Especialidades | Avaliação | Preço |
|------|-------------|----------------|-----------|-------|
| Ana Silva | São Paulo - SP | Musculação, Emagrecimento, Hipertrofia | ⭐ 4.9 (127) | R$ 120/h |
| Carlos Mendes | Rio de Janeiro - RJ | CrossFit, Funcional, Performance | ⭐ 4.8 (98) | R$ 150/h |
| Mariana Costa | Belo Horizonte - MG | Yoga, Pilates, Bem-estar | ⭐ 5.0 (156) | R$ 100/h |

---

## Boas Práticas

- Arquitetura em camadas (Controller → Service → Repository)
- Autenticação via JWT
- Validação de entrada com Zod ou Joi
- Variáveis de ambiente via `.env`
- Tratamento de erros centralizado
- Metodologia ágil (sprints, entregas incrementais)

---

## Como Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/connectfit.git

# Backend
cd server
npm install
cp .env.example .env
npm run dev

# Teste rápido (exemplo via curl)
# Cadastro (entra como aluno no início)
# curl -X POST http://localhost:3333/api/auth/register -H "Content-Type: application/json" -d "{\"nome\":\"Ana Silva\",\"email\":\"ana@exemplo.com\",\"senha\":\"123456\"}"

# Login
# curl -X POST http://localhost:3333/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"ana@exemplo.com\",\"senha\":\"123456\"}"


# Frontend
cd client
npm install
npm run dev
```

---

## Variáveis de Ambiente (`.env`)

```env
PORT=3333
MONGODB_URI=mongodb://localhost:27017/connectfit
JWT_SECRET=sua_chave_secreta
EMAIL_SERVICE_API_KEY=...
PUSH_NOTIFICATION_KEY=...
```
