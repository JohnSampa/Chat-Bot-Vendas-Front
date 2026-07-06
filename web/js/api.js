const API = (() => {
  function getBaseUrl() {
    return (APP_CONFIG.API_BASE_URL || 'https://chat-bot-vendas-bnoi.onrender.com').replace(/\/$/, '');
  }

  function parseProblemDetails(text, status) {
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // Response is not JSON.
    }
    if (body && typeof body === 'object') {
      const message =
        body.title ||
        body.detail ||
        body.message ||
        body.mensagem ||
        body.error;
      if (message) {
        return { message: String(message), status, body };
      }
    }
    return {
      message: text?.trim() || `Erro ${status}`,
      status,
      body,
    };
  }

  class ApiError extends Error {
    constructor({ message, status, body }) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  }

  async function postJson(path, body) {
    const url = `${getBaseUrl()}${path}`;
    const options = { method: 'POST' };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      throw new ApiError(parseProblemDetails(text, res.status));
    }
    try {
      return JSON.parse(text);
    } catch {
      return { tipo: 'MENSAGEM', mensagem: text };
    }
  }

  async function sendMessage(message, clientSessionId) {
    return postJson('/chatbot', { mensagem: message, clientSessionId });
  }

  async function iniciar(clientSessionId) {
    return postJson('/chatbot/iniciar', { clientSessionId, novaSessao: true });
  }

  async function reiniciar(clientSessionId) {
    return postJson('/chatbot/reiniciar', { clientSessionId, novaSessao: true });
  }

  return { sendMessage, iniciar, reiniciar, ApiError };
})();
