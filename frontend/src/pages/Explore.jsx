import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { FormAlert } from "../components/Feedback.jsx";
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

const categories = [
  ["memory", "Tecnologia"],
  ["language", "Idiomas"],
  ["palette", "Artes"],
  ["brush", "Design"],
  ["trending_up", "Marketing"],
  ["spa", "Bem-estar"],
];

export default function Explore({ navigate, reloadKey = 0 }) {
  const { user, logout } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // "loading" | "ok" | "error"
  const [loadError, setLoadError] = useState("");
  const [activeNavItem, setActiveNavItem] = useState("/explore");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Tudo");
  const [activeCategory, setActiveCategory] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState("recent");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [linkUnavailable, setLinkUnavailable] = useState(false);

  // Busca as publicações reais na API ao abrir a tela e sempre que uma nova é criada (reloadKey).
  useEffect(() => {
    let cancelled = false;
    publicacoesApi
      .listar()
      .then((posts) => {
        if (cancelled) return;
        const cards = posts.map(toCard);
        setOpportunities(cards);
        // Vindo do Início (/explore?publicacao=ID): abre o painel de detalhes dessa publicação.
        const id = Number(new URLSearchParams(window.location.search).get("publicacao"));
        if (id) {
          const found = cards.find((card) => card.id === id);
          setSelectedOpportunity(found ?? null);
          if (found) return;
          // Publicação fechada ou inexistente: avisa e tira o parâmetro da URL.
          setLinkUnavailable(true);
          navigate("/explore", { replace: true });
        }
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

  // Ao fechar o painel, tira ?publicacao= da URL para ele não reabrir ao atualizar a página.
  const closeDetails = () => {
    setSelectedOpportunity(null);
    if (window.location.search) navigate("/explore", { replace: true });
  };

  const goTo = (path) => {
    setActiveNavItem(path);

    if (path !== "/explore") {
      navigate(path);
    }
  };

  const filteredOpportunities = useMemo(() => {
    const filtered = opportunities.filter((item) => {
      const searchable =
        `${item.name} ${item.title} ${item.offer} ${item.wants} ${item.tag}`.toLowerCase();

      const matchesQuery = searchable.includes(query.toLowerCase());

      const matchesTab =
        activeTab === "Tudo" ||
        (activeTab === "Ofertas de serviço" ? !item.request : item.request);

      const matchesCategory =
        !activeCategory || item.category === activeCategory;

      const normalize = (value) =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLocaleLowerCase("pt-BR");
      const matchesCity =
        !cityFilter || normalize(item.location).includes(normalize(cityFilter));
      const matchesState =
        !stateFilter ||
        normalize(item.state).includes(normalize(stateFilter)) ||
        normalize(item.stateName).includes(normalize(stateFilter));

      return (
        matchesQuery &&
        matchesTab &&
        matchesCategory &&
        matchesCity &&
        matchesState
      );
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (sortOrder === "recent") {
        return dateB - dateA;
      }

      return dateA - dateB;
    });
  }, [opportunities, query, activeTab, activeCategory, cityFilter, stateFilter, sortOrder]);

  return (
    <div className="explore">
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
              className={`sidebar-item ${
                activeNavItem === item.path ? "active" : ""
              }`}
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

      <main className="explore-main">
        <header className="dashboard-header">
          <div className="header-page">Explorar</div>

          <div className="header-actions">
            <button className="Notifications-button" aria-label="Notificações" onClick={() => navigate("/notifications")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>

              <i />
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
              onClick={() => navigate("/new-post")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Criar uma publicação
            </button>
          </div>
        </header>

        <div className="explore-content">
          <p className="explore-eyebrow">DESCOBRIR</p>

          <h1 className="explore-title">Encontre sua próxima troca</h1>

          <p className="explore-subtitle">
            Pesquise por habilidades, serviços e pessoas prontas para
            compartilhar.
          </p>

          <label className="explore-search">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: inglês, fotografias, planilhas..."
            />
          </label>

          <div className="explore-toolbar">
            <div className="explore-tabs">
              {["Tudo", "Ofertas de serviço", "Solicitações de ajuda"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <button
              className={`filter-button ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                tune
              </span>
              Filtros
              <span className="material-symbols-outlined" aria-hidden="true">
                {showFilters ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <h4>Ordenar por</h4>

                <label>
                  <input
                    type="radio"
                    name="sort"
                    checked={sortOrder === "recent"}
                    onChange={() => setSortOrder("recent")}
                  />
                  Mais recentes
                </label>

                <label>
                  <input
                    type="radio"
                    name="sort"
                    checked={sortOrder === "oldest"}
                    onChange={() => setSortOrder("oldest")}
                  />
                  Mais antigas
                </label>
              </div>

              <div className="filter-group">
                <h4>Localização</h4>

                <label htmlFor="filter-city">Cidade</label>
                <input
                  id="filter-city"
                  type="search"
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  placeholder="Digite a cidade"
                />
                <label htmlFor="filter-state">Estado (UF ou nome)</label>
                <input
                  id="filter-state"
                  type="search"
                  value={stateFilter}
                  onChange={(event) => setStateFilter(event.target.value)}
                  placeholder="Ex.: GO ou Goiás"
                />
              </div>

              <button
                className="clear-filters"
                onClick={() => {
                  setSortOrder("recent");
                  setCityFilter("");
                  setStateFilter("");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}

          <div className="category-row">
            {categories.map(([icon, label]) => (
              <button
                key={label}
                className={activeCategory === label ? "active" : ""}
                onClick={() =>
                  setActiveCategory(activeCategory === label ? "" : label)
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {icon}
                </span>

                {label}
              </button>
            ))}
          </div>

          {linkUnavailable && (
            <FormAlert kind="info">Esta publicação não está mais disponível.</FormAlert>
          )}

          <section className="explore-grid" aria-label="Oportunidades de troca">
            {filteredOpportunities.map((item) => (
              <article className="explore-card" key={item.id}>
                <div className="explore-card-person">
                  <div
                    className="explore-person-avatar"
                    style={{
                      background: item.color,
                    }}
                  >
                    {item.avatar}
                  </div>

                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.time}</small>
                  </div>
                </div>

                <h2>{item.title}</h2>

                <p>
                  <b>{item.offerLabel}:</b> {item.offer}
                  <br />
                  <b>{item.wantsLabel}:</b> {item.wants}
                </p>

                <div className="explore-card-footer">
                  <span className={item.request ? "request-tag" : ""}>
                    {item.tag}
                  </span>

                  <button onClick={() => setSelectedOpportunity(item)}>
                    Ver detalhes <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
          {selectedOpportunity && (
            <div className="details-overlay">
              <div className="details-panel">
                <button
                  className="details-close"
                  onClick={closeDetails}
                  aria-label="Fechar detalhes"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                <img
                  className="details-image"
                  src={asset("TradeUp_Img.webp")}
                  alt=""
                />

                <div className="details-body">
                  <span className="details-category">
                    {selectedOpportunity.request ? "Buscando" : "Oferecendo"} ·{" "}
                    {selectedOpportunity.category}
                  </span>

                  <h2>{selectedOpportunity.title}</h2>

                  <p className="details-description">
                    {selectedOpportunity.description}
                  </p>

                  <div className="details-person">
                    <div
                      className="details-avatar"
                      style={{
                        background: selectedOpportunity.color,
                      }}
                    >
                      {selectedOpportunity.avatar}
                    </div>

                    <div>
                      <strong>{selectedOpportunity.name}</strong>

                      <span>
                        {selectedOpportunity.location},{" "}
                        {selectedOpportunity.state}
                      </span>
                    </div>
                  </div>

                  <div className="details-divider" />

                  <div className="details-exchange">
                    <div>
                      <span>{selectedOpportunity.offerLabel.toUpperCase()}</span>
                      <strong>{selectedOpportunity.offer}</strong>
                    </div>

                    <span className="details-arrow">→</span>

                    <div>
                      <span>MODALIDADE</span>
                      <strong>{selectedOpportunity.wants}</strong>
                    </div>
                  </div>

                  {selectedOpportunity.request && selectedOpportunity.contrapartida && (
                    <p className="details-description">
                      <b>Em troca, {selectedOpportunity.name} oferece:</b> {selectedOpportunity.contrapartida}
                    </p>
                  )}

                  {/* Não se propõe troca para a própria publicação (a API também recusa). */}
                  <button
                    className="details-proposal-button"
                    disabled={selectedOpportunity.authorId === user.id}
                    onClick={() => navigate(`/proposal?publicacao=${selectedOpportunity.id}`)}
                  >
                    {selectedOpportunity.authorId === user.id
                      ? "Esta é a sua publicação"
                      : "Enviar proposta de troca"}
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {loadState === "loading" && (
            <p className="empty-explore">Carregando publicações...</p>
          )}
          {loadState === "error" && (
            <p className="empty-explore">{loadError}</p>
          )}
          {loadState === "ok" && !filteredOpportunities.length && (
            <p className="empty-explore">
              {opportunities.length
                ? "Nenhuma oportunidade encontrada."
                : "Ainda não há publicações. Seja a primeira pessoa a criar uma!"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
