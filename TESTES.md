# ConnectFit — Como executar e testar

## 1. Pré-requisitos
- Node.js 20+ instalado
- App **Expo Go** no celular (ou emulador Android/iOS)
- **ngrok** instalado (para o celular acessar a API) — ou PC e celular na mesma rede Wi-Fi
- No MongoDB Atlas: em **Network Access**, libere o seu IP (ou `0.0.0.0/0` para testes)

## 2. Backend (pasta `server`)
```bash
cd server
npm install
```
Crie o arquivo `server/.env` (copie de `.env.example`) com:
```
PORT=3333
MONGODB_URI=mongodb+srv://pedro_db_user:<db_password>@cluster0.6dbolqz.mongodb.net/
JWT_SECRET=<uma string longa e aleatória>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=
```
Troque `<db_password>` pela senha do usuário `pedro_db_user`
(MongoDB Atlas → Database Access). Se a senha tiver caracteres especiais (`@ : / ? # %`),
codifique-os (ex: `@` → `%40`).

```bash
npm run dev
```
Deve aparecer:
```
[server] API rodando em http://localhost:3333
[db] Conectado ao MongoDB
```
Teste rápido no navegador: http://localhost:3333/health → `{"ok":true}`

Checagem de tipos (opcional): `npm run build` (não deve mostrar erros).

## 3. Expor a API para o celular
Opção A — ngrok (recomendado; funciona com `expo start --tunnel`):
```bash
ngrok http --domain=frisk-carless-fanfare.ngrok-free.dev 3333
```
(versões novas do ngrok usam `--url=` no lugar de `--domain=`)

Opção B — rede local: descubra o IP do PC (`ipconfig` no Windows) e use `http://SEU_IP:3333`.

## 4. App mobile (pasta `mobile`)
Crie `mobile/.env` (copie de `.env.example`) com o endereço da API:
```
EXPO_PUBLIC_API_HOST=https://frisk-carless-fanfare.ngrok-free.dev
EXPO_PUBLIC_API_PORT=443
```
```bash
cd mobile
npm install
npx expo start --tunnel -c
```
Escaneie o QR code com o Expo Go. (`-c` limpa o cache — necessário sempre que mudar o `.env`.)