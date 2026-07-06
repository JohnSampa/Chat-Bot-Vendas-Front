const ChatbotRenderer = (() => {
  const TIPOS = {
    MENSAGEM: 'MENSAGEM',
    LISTA_PRODUTOS: 'LISTA_PRODUTOS',
    LISTA_PRODUTOS_MENSAGEM: 'LISTA_PRODUTOS_MENSAGEM',
    LISTA_VENDAS: 'LISTA_VENDAS',
    PRODUTO_MENSAGEM: 'PRODUTO_MENSAGEM',
    VENDA_MENSAGEM: 'VENDA_MENSAGEM',
    ERRO: 'ERRO',
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(value) {
    if (value == null || Number.isNaN(Number(value))) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  }

  function isProduto(item) {
    return item && (item.id != null || item.nome != null || item.preco != null);
  }

  function isCarrinho(value) {
    return value && typeof value === 'object' && Array.isArray(value.itens);
  }

  function isItemCarrinho(value) {
    return value && typeof value === 'object' && value.produto && value.quantidade != null;
  }

  function renderMensagem(texto, className = 'msg-text') {
    if (!texto) return '';
    return `<p class="${className}">${escapeHtml(texto)}</p>`;
  }

  function renderProduto(produto) {
    if (!produto) return '';
    const nome = escapeHtml(produto.nome || 'Produto');
    const id = produto.id != null
      ? `<div class="produto-card__id">ID ${escapeHtml(produto.id)}</div>`
      : '';
    const preco = produto.preco != null ? formatMoney(produto.preco) : '';

    return `
      <div class="produto-card">
        ${id}
        <div class="produto-card__nome">${nome}</div>
        ${preco ? `<div class="produto-card__meta">${preco}</div>` : ''}
      </div>
    `;
  }

  function renderProdutoList(itens) {
    const list = Array.isArray(itens) ? itens.filter(isProduto) : [];
    if (!list.length) return '';
    return `<div class="produto-list">${list.map(renderProduto).join('')}</div>`;
  }

  function renderItemCarrinho(item) {
    if (!isItemCarrinho(item)) return '';
    const produto = item.produto || {};
    const nome = escapeHtml(produto.nome || 'Produto');
    const id = produto.id != null ? `ID ${escapeHtml(produto.id)}` : '';
    const tamanho = item.tamanho ? `Tamanho ${escapeHtml(item.tamanho)}` : '';
    const preco = produto.preco != null ? formatMoney(produto.preco) : '';
    const quantidade = escapeHtml(item.quantidade);
    const total = item.total != null
      ? formatMoney(item.total)
      : produto.preco != null
        ? formatMoney(Number(produto.preco) * Number(item.quantidade))
        : '';
    const meta = [id, preco, tamanho].filter(Boolean).join(' - ');

    return `
      <div class="carrinho-item">
        <div class="carrinho-item__main">
          <span class="carrinho-item__qty">${quantidade}x</span>
          <span class="carrinho-item__nome">${nome}</span>
        </div>
        ${meta ? `<div class="carrinho-item__meta">${escapeHtml(meta)}</div>` : ''}
        ${total ? `<div class="carrinho-item__total">${total}</div>` : ''}
      </div>
    `;
  }

  function renderCarrinho(carrinho) {
    if (!isCarrinho(carrinho)) return '';
    const itens = carrinho.itens.filter(isItemCarrinho);
    if (!itens.length) return '';
    const total = carrinho.total != null
      ? formatMoney(carrinho.total)
      : formatMoney(itens.reduce((acc, item) => acc + Number(item.total || 0), 0));

    return `
      <div class="carrinho-card">
        <div class="carrinho-card__title">Pedido</div>
        <div class="carrinho-list">${itens.map(renderItemCarrinho).join('')}</div>
        ${total ? `<div class="carrinho-card__footer"><span>Total</span><strong>${total}</strong></div>` : ''}
      </div>
    `;
  }

  function formatProdutoRef(produto) {
    if (produto == null) return '';
    if (typeof produto === 'string') return produto;
    if (typeof produto === 'object') {
      const parts = [];
      if (produto.nome) parts.push(produto.nome);
      if (produto.id != null) parts.push(`ID ${produto.id}`);
      if (produto.preco != null) parts.push(formatMoney(produto.preco));
      return parts.join(' - ');
    }
    return '';
  }

  function getVendaProdutoLabel(venda) {
    return formatProdutoRef(venda.produto) || venda.produtoNome || venda.nomeProduto || '';
  }

  function renderVenda(venda) {
    if (!venda || typeof venda !== 'object') return '';

    const rows = [];
    const add = (label, value) => {
      if (value != null && value !== '') {
        rows.push(
          `<div class="venda-row"><span class="venda-row__label">${escapeHtml(label)}</span><span class="venda-row__value">${escapeHtml(String(value))}</span></div>`
        );
      }
    };

    add('ID venda', venda.id);
    add('Produto', getVendaProdutoLabel(venda));
    add('Quantidade', venda.quantidade);
    add('Tamanho', venda.tamanho);
    add('CPF', venda.cpfCliente);
    add('Status', venda.status);
    if (venda.valor != null || venda.total != null) {
      rows.push(
        `<div class="venda-row"><span class="venda-row__label">Valor</span><span class="venda-row__value venda-row__value--money">${formatMoney(venda.valor ?? venda.total)}</span></div>`
      );
    }
    add('Data', venda.data ?? venda.dataVenda);
    add('Cliente', venda.cliente ?? venda.nomeCliente);

    if (!rows.length) {
      Object.entries(venda).forEach(([key, val]) => {
        if (val == null) return;
        if (key === 'produto' && typeof val === 'object') {
          add('Produto', formatProdutoRef(val));
          return;
        }
        if (typeof val !== 'object') add(key, val);
      });
    }

    if (!rows.length) return '';
    return `<div class="venda-card">${rows.join('')}</div>`;
  }

  function renderVendaList(itens) {
    const list = Array.isArray(itens) ? itens : [];
    if (!list.length) return '';
    return `<div class="venda-list">${list.map(renderVenda).join('')}</div>`;
  }

  function normalize(response) {
    if (response == null) return { tipo: TIPOS.MENSAGEM, mensagem: '' };
    if (typeof response === 'string') {
      return { tipo: TIPOS.MENSAGEM, mensagem: response };
    }
    return response;
  }

  function render(response) {
    const data = normalize(response);
    const tipo = data.tipo || TIPOS.MENSAGEM;
    const mensagem = data.mensagem;
    const lista = data.lista;
    const dados = data.dados;

    let html = '';
    let extraClass = '';

    switch (tipo) {
      case TIPOS.MENSAGEM:
        html = renderMensagem(mensagem);
        break;
      case TIPOS.PRODUTO_MENSAGEM:
        html = (isCarrinho(dados) ? renderCarrinho(dados) : renderProduto(dados)) +
          renderMensagem(mensagem, 'msg-text msg-text--below');
        break;
      case TIPOS.LISTA_PRODUTOS:
        html = renderProdutoList(lista);
        if (!html) html = renderMensagem(mensagem || 'Nenhum produto encontrado.');
        break;
      case TIPOS.LISTA_PRODUTOS_MENSAGEM:
        html = renderProdutoList(lista) + renderMensagem(mensagem, 'msg-text msg-text--below');
        break;
      case TIPOS.LISTA_VENDAS:
        html = renderVendaList(lista);
        if (!html) html = renderMensagem(mensagem || 'Nenhuma venda encontrada.');
        break;
      case TIPOS.VENDA_MENSAGEM:
        html = isCarrinho(dados) ? renderCarrinho(dados) : renderVenda(dados) || renderVendaList(lista);
        html += renderMensagem(mensagem, 'msg-text msg-text--below');
        break;
      case TIPOS.ERRO:
        extraClass = 'validation';
        html = renderMensagem(mensagem || 'Ocorreu um erro.', 'msg-text msg-text--error');
        break;
      default:
        html = renderMensagem(mensagem) ||
          (typeof response === 'object'
            ? `<pre class="msg-raw">${escapeHtml(JSON.stringify(response, null, 2))}</pre>`
            : '');
    }

    return { html: html || renderMensagem('Sem resposta.'), extraClass };
  }

  return { render, TIPOS };
})();
