# ConnectFit

**Integrantes do Projeto:**
- Guilherme Lima Carregã
- Henrique Affonso Luz Rios
- Mateus Barros de Almeida
- Pedro Soares Simões
- Rafael Longobardi Mineiro Varela
- Rhuan Marcos de Oliveira Albuquerque

> Plataforma que conecta alunos a personal trainers qualificados de forma prática e eficiente.

---

## Visão Geral
O **ConnectFit** é um aplicativo mobile (e/ou cliente) que permite que alunos descubram **personais** (ex.: por especialidade e localização), vejam informações de perfil e realizem a transição para o modo **Personal** ao preencher o onboarding profissional.

A aplicação é composta por:
- **Mobile (React Native)**: telas de listagem e perfil, autenticação e onboarding do personal.
- **Backend (Node.js + Express)**: API REST para autenticação (JWT), atualização do perfil do personal e listagem de personais.
- **Banco de dados (MongoDB + Mongoose)**: persistência dos usuários e dos dados do personal.

---

## Estrutura do Projeto

```
connectfit/
├── mobile/            # Aplicativo React Native
│   └── src/
│       ├── contexts/         # AuthContext
│       ├── hooks/            # useAuth
│       ├── navigation/       # Rotas
│       ├── screens/          # Telas (Home, Perfil, Onboarding)
│       └── services/        # Camada HTTP (api, authService, personalService)
└── server/            # API REST com Express
    └── src/
        ├── routes/            # Rotas (auth, personals)
        ├── controllers/       # Handlers das rotas
        ├── services/          # Regras de negócio
        ├── middlewares/       # requireAuth (JWT) e errorHandler
        ├── models/            # Schema Mongoose (User)
        └── validators/       # Validação de payload (Zod)
```

---

## Principais Tecnologias

- **React Native (TypeScript)**: interface mobile.
- **Express + TypeScript**: API REST.
- **JWT**: autenticação e autorização.
- **Zod**: validação de entrada.
- **MongoDB + Mongoose**: persistência.
- **AsyncStorage**: persistência local no mobile (token e usuário).

---

## Funcionalidades (visão geral)

### Mobile
- **Home / Busca de Personais**: lista de personais e filtros (busca por texto, especialidade e localidade).
- **Perfil do Usuário**: exibe dados do usuário e acesso ao onboarding do personal quando `tipo==='aluno'`.
- **Onboarding do Personal**: formulário para preencher dados profissionais e enviar ao backend autenticado.

### Backend
- **Autenticação**:
  - cadastro e login de usuários (alunos no início).
  - geração de JWT contendo `sub` e `tipo`.
- **Ativação do Personal**:
  - rota protegida por JWT que atualiza os campos profissionais do usuário.
- **Listagem de Personais**:
  - endpoint público para retornar personais com campos no formato esperado pelo app.

---

## Integração entre Mobile e Backend

- **Mobile** usa `services/api.ts` para realizar chamadas HTTP com parse de resposta e tratamento de erros.
- **Autenticação**: ao fazer login/registro, o mobile persiste o token e o usuário no `AsyncStorage`.
- **Rotas protegidas**: o backend exige `Authorization: Bearer <token>` via middleware `requireAuth`.

---

## Observações
Este README descreve, de forma geral, o que o projeto faz e como ele está organizado. Para instruções de execução, consulte a documentação dentro de cada pasta (**`mobile/`** e **`server/`**). 

