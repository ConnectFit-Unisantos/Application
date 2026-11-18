# ConnectFit - Mobile

Aplicativo mobile do **ConnectFit** feito com **React Native (Expo)** e **TypeScript**.

O app consome a API do backend (Express) para:
- autenticar usuários (JWT)
- listar personais na Home
- ativar/atualizar o perfil de personal via onboarding

---

## Estrutura (alto nível)

- `src/contexts/` — `AuthContext` (estado global: user/token)
- `src/hooks/` — `useAuth` (facade para telas)
- `src/navigation/` — `AppNavigator` (rotas)
- `src/screens/` — telas principais (Home, Login, Register, Perfil, Onboarding, Detalhe)
- `src/services/` — camada HTTP e serviços de domínio
  - `api.ts` — wrapper fetch
  - `authService.ts` — login/register/logout e persistência
  - `personalService.ts` — `listPersonals()`
- `src/utils/storage.ts` — persistência no dispositivo (AsyncStorage)

---

## Funcionalidades implementadas (no código atual)

- **Home**: busca e filtros de personais (nome/busca, especialidade, localidade) + listagem via `personalService`.
- **Perfil**: exibe dados do usuário; quando o `tipo` é `aluno`, mostra acesso ao onboarding de personal.
- **Onboarding de Personal**: formulário com campos profissionais e envio para endpoint autenticado.
- **Agendamento**: aluno escolhe data/horário livres (vindos do backend), revisa e confirma; acompanha em "Minhas Aulas" (status pendente/confirmada/concluída/cancelada/recusada) e pode cancelar.
- **Agenda do personal**: solicitações, confirmadas e histórico; confirmar/recusar/cancelar; tela de Disponibilidade (horários semanais e folgas).
- **Chat**: conversas aluno ↔ personal com histórico, não lidas e atualização em tempo real (Socket.IO, `src/services/realtime.ts`).

---

## Requisitos

- Node.js
- Conta de desenvolvimento/ambiente do Expo (para rodar em emulador/dispositivo)

---

## Como rodar localmente

```bash
cd mobile
npm install
npm start
```

Para rodar em dispositivos:
- **Android**: pressione `a` no terminal do Expo (ou use `npm run android`)
- **iOS**: use `npm run ios` (em Mac)

---

## Configuração de API

O endereço do backend é lido nesta ordem (ver `src/configs/api.config.ts`):
1. `mobile/.env` → `EXPO_PUBLIC_API_HOST` / `EXPO_PUBLIC_API_PORT` (copie de `.env.example`)
2. `app.json` → `expo.extra`
3. Padrão local: `10.0.2.2:3333` (emulador Android) ou `localhost:3333`

Depois de alterar o `.env`, reinicie com `npx expo start -c`.

---

## Deploy / Build (sugestão)

- `expo build:android`
- `expo build:ios`

