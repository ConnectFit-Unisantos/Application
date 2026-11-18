# Bugs conhecidos

Todos os itens abaixo foram corrigidos em 28/10/2026 - 18/11/2026:

- ~~Email sem ".com" mostrava "Validation error"~~ → a API agora devolve a mensagem do campo ("Informe um e-mail válido") e o app mostra embaixo do campo.
- ~~Personal sem localidade aparecia em qualquer filtro de localidade~~ → não aparece mais quando há filtro; localidade passou a ser obrigatória no cadastro de personal.
- ~~Usuário deletado do banco continuava logado~~ → a API confere se o usuário existe em toda rota protegida e o app valida a sessão (`/api/auth/me`) ao abrir e ao entrar no Perfil.
- ~~Especialidade diferenciava maiúsculas/minúsculas~~ → especialidades são padronizadas ("Hipertrofia") e o filtro ignora maiúsculas e acentos.
