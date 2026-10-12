const asset = (name) => `/assets/${name}`;

export default function NotFound({ navigate, isAuthenticated }) {
  return (
    <main className="session-screen">
      <img className="login-brand" src={asset("5-3.png")} alt="TradeUp+" />
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe ou foi movido.</p>
      <button type="button" className="session-button" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
        {isAuthenticated ? "Ir para o painel" : "Voltar ao início"}
      </button>
    </main>
  );
}
