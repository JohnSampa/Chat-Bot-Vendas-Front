# Chat Bot Vendas - Front

Front estatico do chatbot de vendas.

## Arquivos principais

- `web/index.html`: pagina principal.
- `web/chat.css`: estilos.
- `web/chat.js`: comportamento da tela.
- `web/js/app-config.js`: URL do backend.
- `web/js/api.js`: chamadas HTTP.
- `web/js/chatbot-response.js`: renderizacao das respostas do bot.

## Configurar API

Antes de publicar no GitHub Pages, edite `web/js/app-config.js` e informe a URL publica do backend Spring:

```js
const APP_CONFIG = {
  API_BASE_URL: 'https://sua-api-publica.com',
};
```

O backend precisa permitir CORS para o dominio do GitHub Pages.

## Publicar no GitHub Pages

Este projeto usa GitHub Actions pelo arquivo `.github/workflows/deploy-pages.yml`.

No GitHub:

1. Abra `Settings`.
2. Acesse `Pages`.
3. Em `Source`, selecione `GitHub Actions`.
4. Faça push na branch `main`.

O workflow publica o conteudo da pasta `web/`.

## Rodar localmente

Dentro da pasta `web/`:

```bash
node serve.mjs
```

Depois acesse:

```text
http://localhost:3000
```
