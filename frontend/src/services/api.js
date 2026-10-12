// Camada de comunicação com a API (FastAPI).
// Todas as telas falam com o servidor SOMENTE por aqui. A URL base vem do arquivo .env (VITE_API_URL).

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const TIMEOUT_MS = 15000;

// ---------------------------------------------------------------- token
// O token fica no localStorage para a sessão sobreviver a recarregar a página.
// (O token expira sozinho em 60 minutos; "Sair" apaga o token do navegador.)
const TOKEN_KEY = "tradeup.token";

export const tokenStore = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* navegador bloqueou o armazenamento: a sessão vale só até recarregar */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada a fazer */
    }
  },
  key: TOKEN_KEY,
};

// ---------------------------------------------------------------- erros
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, network = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = não houve resposta do servidor
    this.fieldErrors = fieldErrors; // { email: "mensagem", ... } vindo da validação do back-end
    this.network = network;
  }
}

// Chamado quando uma requisição AUTENTICADA volta 401 (token vencido ou inválido).
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = auth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (erro) {
    const demorou = erro?.name === "AbortError";
    throw new ApiError(
      demorou
        ? "O servidor demorou demais para responder. Tente novamente."
        : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      { network: true },
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* resposta sem JSON */
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized(data?.mensagem);
    throw new ApiError(data?.mensagem ?? `Erro inesperado do servidor (${response.status}).`, {
      status: response.status,
      fieldErrors: data?.erros ?? {},
    });
  }
  return data;
}

// ---------------------------------------------------------------- endpoints
export const authApi = {
  register: (dados) => request("/auth/register", { method: "POST", body: dados, auth: false }),
  login: (dados) => request("/auth/login", { method: "POST", body: dados, auth: false }),
  me: () => request("/auth/me"),
  // nome, estado, cidade e descricao do próprio usuário (o e-mail não muda)
  atualizarPerfil: (dados) => request("/auth/me", { method: "PATCH", body: dados }),
};

export function getHealth() {
  return request("/health", { auth: false });
}

export const localidadesApi = {
  cidades: (uf) => request(`/localidades/${encodeURIComponent(uf)}/cidades`, { auth: false }),
};

export const publicacoesApi = {
  listar: () => request("/publicacoes"),
  criar: (dados) => request("/publicacoes", { method: "POST", body: dados }),
  buscar: (id) => request(`/publicacoes/${encodeURIComponent(id)}`),
  minhas: () => request("/publicacoes/minhas"),
  // só o dono pode cancelar (a API confere)
  cancelar: (id) => request(`/publicacoes/${encodeURIComponent(id)}`, { method: "PATCH", body: { status: "cancelada" } }),
};

export const propostasApi = {
  enviar: (dados) => request("/propostas", { method: "POST", body: dados }),
  enviadas: () => request("/propostas/enviadas"),
  recebidas: () => request("/propostas/recebidas"),
  // status: "aceita" ou "recusada" (só o dono da publicação pode responder)
  responder: (id, status) => request(`/propostas/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } }),
};
