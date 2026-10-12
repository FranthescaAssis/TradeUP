import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { FormAlert } from "../components/Feedback.jsx";
import { propostasApi, publicacoesApi } from "../services/api.js";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

// Status que vêm do banco -> texto e cor do selo (as cores já existem no CSS).
const STATUS = {
  pendente: { label: "Pendente", tone: "yellow" },
  aceita: { label: "Aceita", tone: "green" },
  recusada: { label: "Recusada", tone: "red" },
  concluida: { label: "Concluída", tone: "green" },
  cancelada: { label: "Cancelada", tone: "red" },
};

const TAB_MINE = "Minhas publicações";

// Selo de uma publicação própria. "ativa" com proposta aceita (disponivel=false) é uma troca em andamento.
function postStatus(post) {
  if (post.status === "cancelada") return { label: "Cancelada", tone: "red" };
  if (post.status === "concluida") return { label: "Concluída", tone: "green" };
  return post.disponivel ? { label: "Ativa", tone: "green" } : { label: "Troca aceita", tone: "yellow" };
}

const MODALITY_LABELS = { online: "Online", presencial: "Presencial", ambos: "Online ou presencial" };

const FILTERS = ["Todos", "Pendentes", "Aceitas", "Concluídas", "Recusadas"];
const FILTER_STATUS = { Pendentes: "pendente", Aceitas: "aceita", Concluídas: "concluida", Recusadas: "recusada" };

// "2026-12-01" -> "01/12/2026" (sem passar por Date, para o fuso horário não mudar o dia)
const formatDay = (iso) => iso.split("-").reverse().join("/");

function dateText(trade) {
  if (trade.tipo_data === "unica" && trade.data_troca) return `Data sugerida: ${formatDay(trade.data_troca)}`;
  if (trade.tipo_data === "periodo" && trade.data_troca && trade.data_fim) {
    return `Período sugerido: ${formatDay(trade.data_troca)} a ${formatDay(trade.data_fim)}`;
  }
  return "Data a combinar";
}

// Do ponto de vista do dono da publicação: o que ele oferece e o que recebe do proponente.
// Oferta: o próprio anúncio. Solicitação: a contrapartida que o autor cadastrou.
function contribuicoes(trade) {
  const { publicacao } = trade;
  return {
    oferece: publicacao.tipo === "necessidade" ? publicacao.contrapartida : publicacao.titulo,
    recebe: trade.oferta,
  };
}

export default function MyTrades({ navigate }) {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState("/mytrades");
  const [tradeTab, setTradeTab] = useState("Recebidas");
  const [filter, setFilter] = useState("Todos");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // "loading" | "ok" | "error"
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState(null); // proposta sendo aceita/recusada agora
  const [actionError, setActionError] = useState("");

  // Busca no PostgreSQL (via API) as propostas recebidas e enviadas. Também é usada depois de aceitar/recusar,
  // porque aceitar uma proposta recusa automaticamente as outras pendentes da mesma publicação.
  const load = useCallback(async () => {
    try {
      const [recebidas, enviadas, publicacoes] = await Promise.all([
        propostasApi.recebidas(),
        propostasApi.enviadas(),
        publicacoesApi.minhas(),
      ]);
      setReceived(recebidas);
      setSent(enviadas);
      setMyPosts(publicacoes);
      setLoadState("ok");
    } catch (erro) {
      setLoadError(erro.message);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goTo = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  const changeTradeTab = (tab) => {
    setTradeTab(tab);
    setFilter("Todos");
    setSelectedTrade(null);
    setActionError("");
  };

  const source = tradeTab === "Recebidas" ? received : sent;
  const visibleTrades = useMemo(
    () => (filter === "Todos" ? source : source.filter((trade) => trade.status === FILTER_STATUS[filter])),
    [filter, source],
  );

  // Só o dono da publicação responde. A API confere isso de novo; aqui só mostramos os botões.
  async function respond(trade, status) {
    if (status === "aceita") {
      const { oferece, recebe } = contribuicoes(trade);
      const texto =
        `Você oferece: ${oferece || "(não informado)"}
Você recebe: ${recebe || "(não informado)"}

` +
        "Aceitar esta proposta? As outras propostas pendentes desta publicação serão recusadas.";
      if (!window.confirm(texto)) return;
    }
    setActionError("");
    setActingId(trade.id);
    try {
      await propostasApi.responder(trade.id, status);
    } catch (erro) {
      setActionError(erro.message);
    } finally {
      await load(); // mostra o status real que está no banco (inclusive se outra pessoa mudou algo)
      setActingId(null);
    }
  }

  // Só publicações ativas e sem proposta aceita podem ser canceladas; as propostas pendentes dela também são canceladas.
  async function cancelPost(post) {
    if (
      !window.confirm(
        `Cancelar a publicação "${post.titulo}"? Ela deixará de aparecer no Explorar e as propostas pendentes serão canceladas.`,
      )
    )
      return;
    setActionError("");
    setActingId(`pub-${post.id}`);
    try {
      await publicacoesApi.cancelar(post.id);
    } catch (erro) {
      setActionError(erro.message);
    } finally {
      await load();
      setActingId(null);
    }
  }

  // Qualquer um dos dois participantes pode concluir uma troca aceita. A API confere tudo de novo.
  async function complete(trade) {
    if (!window.confirm("Concluir esta troca? Depois de concluída, a troca não poderá ser desfeita.")) return;
    setActionError("");
    setActingId(trade.id);
    try {
      await propostasApi.responder(trade.id, "concluida");
    } catch (erro) {
      setActionError(erro.message);
    } finally {
      await load();
      setActingId(null);
    }
  }

  return (
    <div className="my-trades-page">
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
              className={`sidebar-item ${activeNav === item.path ? "active" : ""}`}
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

      <main className="my-trades-main">
        <header className="dashboard-header">
          <div className="header-page">Minhas Trocas</div>
          <div className="header-actions">
            <button className="Notifications-button" aria-label="Notificações" onClick={() => navigate("/notifications")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>
              <i />
            </button>
            <button className="profile-button" aria-label="Perfil" onClick={() => navigate("/profile")}>
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

        <div className="my-trades-content">
          <p className="trades-eyebrow">ACOMPANHE TUDO</p>
          <h1 className="trades-title">Minhas trocas</h1>
          <p className="trades-subtitle">
            Veja o andamento das suas propostas e mantenha cada combinação em
            movimento.
          </p>

          <div
            className="trades-tabs"
            role="tablist"
            aria-label="Tipo de proposta"
          >
            {["Recebidas", "Enviadas", TAB_MINE].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={tradeTab === tab}
                className={tradeTab === tab ? "active" : ""}
                onClick={() => changeTradeTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {tradeTab !== TAB_MINE && (
          <div
            className="trades-filters"
            role="tablist"
            aria-label="Status das trocas"
          >
            {FILTERS.map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          )}

          <FormAlert kind="error">{actionError}</FormAlert>

          <section
            className="trades-list"
            aria-label={`Propostas ${tradeTab.toLowerCase()}`}
          >
            {loadState === "ok" &&
              tradeTab === TAB_MINE &&
              myPosts.map((post) => {
                const status = postStatus(post);
                const canCancel = post.status === "ativa" && post.disponivel;
                return (
                  <article key={post.id} className="trade-card">
                    <div className={`trade-icon ${status.tone}`}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        campaign
                      </span>
                    </div>
                    <div className="trade-info">
                      <h2>{post.titulo}</h2>
                      <p>
                        {post.tipo === "necessidade" ? "Solicitação" : "Oferta"} · {post.categoria} ·{" "}
                        {MODALITY_LABELS[post.modalidade]}
                      </p>
                      {post.contrapartida && <small>Em troca: {post.contrapartida}</small>}
                      <small>Publicada em {new Date(post.data_criacao).toLocaleDateString("pt-BR")}</small>
                    </div>
                    <span className={`trade-status ${status.tone}`}>{status.label}</span>
                    {canCancel && (
                      <div className="trade-actions">
                        <button
                          className="details-action"
                          disabled={actingId === `pub-${post.id}`}
                          onClick={() => cancelPost(post)}
                        >
                          Cancelar publicação
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            {loadState === "ok" &&
              tradeTab !== TAB_MINE &&
              visibleTrades.map((trade) => {
                const status = STATUS[trade.status];
                const isReceived = tradeTab === "Recebidas";
                const person = isReceived ? trade.proponente : trade.dono;
                const canRespond = isReceived && trade.status === "pendente";
                const canComplete = trade.status === "aceita";
                return (
                  <article
                    key={trade.id}
                    className={`trade-card ${selectedTrade === trade.id ? "selected" : ""}`}
                    onClick={() => setSelectedTrade(trade.id)}
                  >
                    <div className={`trade-icon ${status.tone}`}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        arrow_forward
                      </span>
                    </div>
                    <div className="trade-info">
                      <h2>{trade.publicacao.titulo}</h2>
                      <p>
                        {isReceived ? "de" : "para"} <strong>{person.nome}</strong> · {person.cidade}, {person.estado}
                      </p>
                      {isReceived ? (
                        <>
                          <small>Você oferece: {contribuicoes(trade).oferece || "não informado"}</small>
                          <small>Você recebe: {contribuicoes(trade).recebe || "não informado"}</small>
                        </>
                      ) : (
                        <small>Oferece: {trade.oferta}</small>
                      )}
                      <small>
                        {dateText(trade)} · enviada em {new Date(trade.data_proposta).toLocaleDateString("pt-BR")}
                      </small>
                      {selectedTrade === trade.id && trade.mensagem && <small>Mensagem: {trade.mensagem}</small>}
                    </div>
                    <span className={`trade-status ${status.tone}`}>{status.label}</span>
                    {canComplete && (
                      <div className="trade-actions">
                        <button
                          className="conversation-action"
                          disabled={actingId === trade.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            complete(trade);
                          }}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">
                            task_alt
                          </span>
                          Concluir troca
                        </button>
                      </div>
                    )}
                    {canRespond && (
                      <div className="trade-actions">
                        <button
                          className="conversation-action"
                          disabled={actingId === trade.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            respond(trade, "aceita");
                          }}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">
                            check
                          </span>
                          Aceitar
                        </button>
                        <button
                          className="details-action"
                          disabled={actingId === trade.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            respond(trade, "recusada");
                          }}
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            {loadState === "loading" && (
              <div className="empty-trades">
                <strong>Carregando propostas...</strong>
              </div>
            )}
            {loadState === "error" && (
              <div className="empty-trades">
                <span className="material-symbols-outlined">error</span>
                <strong>Não foi possível carregar as propostas</strong>
                <p>{loadError}</p>
                <button className="details-action" onClick={load}>
                  Tentar novamente
                </button>
              </div>
            )}
            {loadState === "ok" && tradeTab === TAB_MINE && myPosts.length === 0 && (
              <div className="empty-trades">
                <span className="material-symbols-outlined">inbox</span>
                <strong>Nenhuma publicação encontrada</strong>
                <p>Você ainda não criou publicações. Use "Criar uma publicação" para começar.</p>
              </div>
            )}
            {loadState === "ok" && tradeTab !== TAB_MINE && visibleTrades.length === 0 && (
              <div className="empty-trades">
                <span className="material-symbols-outlined">inbox</span>
                <strong>Nenhuma proposta encontrada</strong>
                <p>
                  {source.length === 0
                    ? `Não há registros de propostas ${tradeTab.toLowerCase()} por enquanto.`
                    : "Não há propostas com esse filtro no momento."}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
