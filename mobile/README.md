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

O endpoint do backend é configurado em `src/configs/api.config.ts`.

---

## Deploy / Build (sugestão)

- `expo build:android`
- `expo build:ios`

(Se quiser, o pipeline pode ser documentado conforme o fluxo do seu curso/equipe.)

