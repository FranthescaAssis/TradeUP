// Tela mostrada no lugar de uma página privada enquanto a sessão não está confirmada.
const asset = (name) => `/assets/${name}`;

export default function SessionGate({ status, onRetry, navigate }) {
  if (status === "unavailable") {
    return (
      <main className="session-screen">
        <img className="login-brand" src={asset("5-3.png")} alt="TradeUp+" />
        <h1>Servidor indisponível</h1>
        <p>Não conseguimos falar com o servidor do TradeUp agora. Sua sessão foi mantida; tente novamente em instantes.</p>
        <button type="button" className="session-button" onClick={onRetry}>
          Tentar novamente
        </button>
        <button type="button" className="forgot-link" onClick={() => navigate("/")}>
          Voltar ao início
        </button>
      </main>
    );
  }

  // "loading" (confirmando o token) ou "anonymous" (redirecionando para o login)
  return (
    <main className="session-screen" aria-busy="true">
      <div className="session-spinner" role="status" aria-label="Carregando" />
      <p>{status === "loading" ? "Verificando sua sessão..." : "Redirecionando para o login..."}</p>
    </main>
  );
}
