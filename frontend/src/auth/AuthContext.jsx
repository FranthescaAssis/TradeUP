// Estado de autenticação do app inteiro.
//   status: "loading"      -> há um token salvo e estamos perguntando à API quem é o usuário
//           "authenticated"-> usuário conectado (user preenchido)
//           "anonymous"    -> ninguém conectado
//           "unavailable"  -> há token, mas a API não respondeu (não perdemos a sessão por isso)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setUnauthorizedHandler, tokenStore } from "../services/api.js";
import { useFeedback } from "../components/Feedback.jsx";

const AuthContext = createContext(null);

function prepararUsuario(usuario) {
  const nome = usuario.nome ?? "";
  return {
    ...usuario,
    primeiroNome: nome.split(" ")[0] || nome,
    inicial: nome.trim().charAt(0).toUpperCase() || "?",
  };
}

const ANONIMO = (motivo = null) => ({ status: "anonymous", user: null, motivo });

export function AuthProvider({ children }) {
  const { notify } = useFeedback();
  const [state, setState] = useState(() => (tokenStore.get() ? { status: "loading", user: null } : ANONIMO()));
  const [tentativa, setTentativa] = useState(0);

  // Ao abrir o app (ou recarregar a página): se existe token, confirma com a API quem é o usuário.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelado = false;
    setState((atual) => (atual.status === "authenticated" ? atual : { status: "loading", user: null }));
    authApi
      .me()
      .then((usuario) => {
        if (!cancelado) setState({ status: "authenticated", user: prepararUsuario(usuario) });
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.network || erro.status >= 500) {
          setState({ status: "unavailable", user: null });
        } else {
          // 401: token vencido, inválido ou conta bloqueada
          tokenStore.clear();
          setState(ANONIMO("expirada"));
          if (erro.message) notify("info", erro.message);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa, notify]);

  // Qualquer requisição autenticada que volte 401 derruba a sessão local.
  useEffect(() => {
    setUnauthorizedHandler((mensagem) => {
      tokenStore.clear();
      setState(ANONIMO("expirada"));
      notify("info", mensagem || "Sua sessão expirou. Entre novamente.");
    });
    return () => setUnauthorizedHandler(() => {});
  }, [notify]);

  const iniciarSessao = useCallback((resposta) => {
    tokenStore.set(resposta.access_token);
    const user = prepararUsuario(resposta.usuario);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    return iniciarSessao(await authApi.login({ email: email.trim(), senha: password }));
  }, [iniciarSessao]);

  const register = useCallback(async (dados) => iniciarSessao(await authApi.register(dados)), [iniciarSessao]);

  // Sair: apaga o token do navegador. Sem token, as páginas privadas deixam de abrir.
  const logout = useCallback(() => {
    tokenStore.clear();
    setState(ANONIMO("logout"));
    notify("success", "Você saiu da sua conta.");
  }, [notify]);

  // Depois de salvar o perfil, a tela mostra os dados novos sem precisar entrar de novo.
  const updateUser = useCallback((usuario) => {
    setState((atual) => ({ ...atual, user: prepararUsuario(usuario) }));
  }, []);

  const retry = useCallback(() => setTentativa((n) => n + 1), []);

  const value = useMemo(
    () => ({ ...state, isAuthenticated: state.status === "authenticated", login, register, logout, updateUser, retry }),
    [state, login, register, logout, updateUser, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
