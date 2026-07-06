(function () {
  const messagesInner = document.getElementById('messages-inner');
  const form = document.getElementById('composer-form');
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const btnNewChat = document.getElementById('btn-new-chat');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuToggle = document.getElementById('menu-toggle');

  let busy = false;
  let clientSessionId = localStorage.getItem('chatbot-vendas-session-id') || criarClientSessionId();

  function criarClientSessionId() {
    const id = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `sessao-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('chatbot-vendas-session-id', id);
    return id;
  }

  function novaSessaoLocal() {
    clientSessionId = criarClientSessionId();
    return clientSessionId;
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
  }

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim() || busy;
    autoResize();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) form.requestSubmit();
    }
  });

  function scrollToBottom() {
    document.getElementById('messages').scrollTop =
      document.getElementById('messages').scrollHeight;
  }

  function hideWelcome() {
    document.getElementById('welcome')?.remove();
  }

  function addMessage(role, content, extraClass = '', asHtml = false) {
    hideWelcome();
    const el = document.createElement('article');
    el.className = `message ${role} ${extraClass}`.trim();
    const initial = role === 'user' ? 'V' : role === 'error' ? '!' : 'B';
    el.innerHTML = `
      <div class="message-avatar" aria-hidden="true">${initial}</div>
      <div class="message-body"></div>
    `;
    const body = el.querySelector('.message-body');
    if (asHtml) {
      body.innerHTML = content;
      body.classList.add('message-body--rich');
    } else {
      body.textContent = content;
    }
    messagesInner.appendChild(el);
    scrollToBottom();
    return el;
  }

  function showBotResponse(response, targetEl) {
    const { html, extraClass } = ChatbotRenderer.render(response);
    targetEl.classList.remove('loading');
    if (extraClass) targetEl.classList.add(extraClass);
    const body = targetEl.querySelector('.message-body');
    body.classList.add('message-body--rich');
    body.innerHTML = html;
  }

  async function sendMessage(text) {
    if (busy) return;
    busy = true;
    sendBtn.disabled = true;

    addMessage('user', text);
    input.value = '';
    autoResize();

    const loadingEl = addMessage('assistant', 'Pensando...', 'loading');

    try {
      const reply = await API.sendMessage(text, clientSessionId);
      showBotResponse(reply, loadingEl);
    } catch (err) {
      loadingEl.classList.remove('loading');
      const msg = err.message || 'Falha ao contactar a API.';

      if (err.status >= 400 && err.status < 500) {
        showBotResponse({ tipo: 'ERRO', mensagem: msg }, loadingEl);
      } else {
        loadingEl.remove();
        addMessage('error', msg);
      }
    } finally {
      busy = false;
      sendBtn.disabled = !input.value.trim();
      scrollToBottom();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) sendMessage(text);
  });

  async function reiniciarChat() {
    if (busy) return;
    busy = true;
    sendBtn.disabled = true;
    messagesInner.innerHTML = '';

    const loadingEl = addMessage('assistant', 'Reiniciando...', 'loading');

    try {
      const reply = await API.iniciar(novaSessaoLocal());
      showBotResponse(reply, loadingEl);
    } catch (err) {
      loadingEl.classList.remove('loading');
      const msg = err.message || 'Falha ao reiniciar a conversa.';

      if (err.status >= 400 && err.status < 500) {
        showBotResponse({ tipo: 'ERRO', mensagem: msg }, loadingEl);
      } else {
        loadingEl.remove();
        addMessage('error', msg);
      }
    } finally {
      busy = false;
      sendBtn.disabled = !input.value.trim();
      input.focus();
      scrollToBottom();
    }
  }

  btnNewChat.addEventListener('click', reiniciarChat);

  reiniciarChat();

  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
})();
