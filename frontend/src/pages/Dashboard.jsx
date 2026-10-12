import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { publicacoesApi } from "../services/api.js";
import { toCard } from "../services/oportunidades.js";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

export default function Home({ navigate, reloadKey = 0 }) {
  const { user, logout } = useAuth();
  const [activeNavItem, setActiveNavItem] = useState("/dashboard");
  const [query, setQuery] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // "loading" | "ok" | "error"
  const [loadError, setLoadError] = useState("");
  const activeNav =
    navItems.find((item) => item.path === activeNavItem)?.label || "Início";

  const goTo = (path) => {
    setActiveNavItem(path);
    if (path !== "/dashboard") navigate(path);
  };

  // Mesmas publicações reais da tela Explorar; recarrega quando uma nova é criada (reloadKey).
  useEffect(() => {
    let cancelled = false;
    publicacoesApi
      .listar()
      .then((posts) => {
        if (cancelled) return;
        setOpportunities(posts.map(toCard));
        setLoadState("ok");
      })
      .catch((erro) => {
        if (cancelled) return;
        setLoadError(erro.message);
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // A busca vale para todas as publicações; só depois o resultado é limitado às 5 mais recentes.
  const filteredOpportunities = useMemo(() => {
    const term = query.toLowerCase();
    return opportunities
      .filter((item) =>
        `${item.name} ${item.location} ${item.state} ${item.title} ${item.description} ${item.offer} ${item.wants}`
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [opportunities, query]);

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <button
          className="dashboard-brand-link"
          onClick={() => navigate("/")}
          aria-label="Ir para o início"
        >
          <img
            className="dashboard-brand"
            src={asset("5-3.png")}
            alt="TradeUp+"
          />
        </button>

        <p className="sidebar-intro">
          Troque o que você sabe, <br />
          <strong>descubra o que vem depois</strong>
        </p>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${activeNavItem === item.path ? "active" : ""}`}
              onClick={() => goTo(item.path)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {item.icone}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar marina-avatar">{user.inicial}</div>
          <strong>{user.nome}</strong>
        </div>
        <button className="logout-button" onClick={logout}>
          Sair da Conta
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-page">{activeNav}</div>
          <div className="header-actions">
            <button className="Notifications-button" aria-label="Notificações" onClick={() => navigate("/notifications")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>
            </button>
            <button
              className="profile-button"
              aria-label="Perfil"
              onClick={() => navigate("/profile")}
            >
              <span className="profile-avatar marina-avatar">{user.inicial}</span>
              <strong>{user.nome}</strong>
            </button>
            <button
              className="create-post-button"
              onClick={() => goTo("/new-post")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Criar uma publicação
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <h1 className="dashboard-title">Olá, {user.primeiroNome}</h1>
            <p className="dashboard-subtitle">
              Veja o que está acontecendo na comunidade e encontre novos
              conhecimentos para trocar hoje.
            </p>
          </section>

          <section className="hero-banner">
            <div className="hero-message">
              <span className="hero-eyebrow">TROCAS QUE FAZEM SENTIDO</span>
              <h2>
                Seu próximo
                <br />
                <em>aprendizado</em>
                <br />
                pode estar aqui.
              </h2>
              <button className="hero-cta" onClick={() => goTo("/explore")}>
                Explorar oportunidades{" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </div>
            <img
              className="hero-art"
              src={asset("TradeUp_Img.webp")}
              alt="Pessoas trocando habilidades"
            />
          </section>

          <section className="recent-opportunities">
            <div className="opportunities-heading">
              <div>
                <span>PARA VOCÊ</span>
                <h2>Oportunidades Recentes</h2>
              </div>
              <button onClick={() => goTo("/explore")}>
                Ver todas <span>→</span>
              </button>
            </div>
            <label className="opportunity-search">
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque uma habilidade ou serviço..."
              />
            </label>
            <div className="opportunity-list">
              {filteredOpportunities.map((item) => (
                <article className="opportunity-card" key={item.id}>
                  <div className="opportunity-person">
                    <div
                      className="person-avatar"
                      style={{ background: item.color }}
                    >
                      {item.avatar}
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.time}, {item.state}</small>
                    </div>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="opportunity-tags">
                    <span>
                      {item.offerLabel}: {item.offer}
                    </span>
                    <span>
                      {item.wantsLabel}: {item.wants}
                    </span>
                  </div>
                  <button
                    className="opportunity-details"
                    onClick={() => navigate(`/explore?publicacao=${item.id}`)}
                  >
                    Ver detalhes <span>→</span>
                  </button>
                </article>
              ))}
            </div>
            {loadState === "loading" && (
              <p className="empty-explore">Carregando publicações...</p>
            )}
            {loadState === "error" && <p className="empty-explore">{loadError}</p>}
            {loadState === "ok" && !filteredOpportunities.length && (
              <p className="empty-explore">
                {opportunities.length
                  ? "Nenhuma oportunidade encontrada."
                  : "Nenhuma oportunidade disponível no momento."}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
