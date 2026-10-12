import { useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { useFeedback } from "../components/Feedback.jsx";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

const tradeDetails = {
  1: {
    status: "CONCLUÍDA",
    statusClass: "completed",
    title: "Edição de Vídeo",
    person: "Gustavo Lima",
    location: "São Paulo",
    started: "Concluída em 28 de agosto de 2026",
    yours: "Edição de vídeo",
    theirs: "Organização financeira pessoal",
    date: "28/08/2026",
    avatar: "G",
    avatarColor: "#78a980",
  },
  2: {
    status: "EM ANDAMENTO",
    statusClass: "active",
    title: "Organização Financeira Pessoal",
    person: "Ana Lima",
    location: "Rio de Janeiro",
    started: "Iniciada em 15 de agosto de 2026 · Prazo: 03 de setembro de 2026",
    yours: "Organização financeira pessoal",
    theirs: "Design Gráfico",
    date: "10/09/2026",
    avatar: "A",
    avatarColor: "#b98768",
  },
  3: {
    status: "PENDENTE",
    statusClass: "pending",
    title: "Aula de Inglês para conversação",
    person: "Beatriz Sousa",
    location: "Anápolis, GO",
    started: "Proposta enviada em 02 de setembro de 2026",
    yours: "Conversação em inglês",
    theirs: "Fotografia",
    date: "10/09/2026",
    avatar: "B",
    avatarColor: "#dfa98b",
  },
  4: {
    status: "RECEBIDA",
    statusClass: "received",
    title: "Aulas de Programação",
    person: "Rafael Mendes",
    location: "Recife",
    started: "Recebida em 01 de setembro de 2026",
    yours: "Organização financeira pessoal",
    theirs: "Programação",
    date: "15/09/2026",
    avatar: "R",
    avatarColor: "#a7c5dc",
  },
};

export default function TradeDetails({ navigate, tradeId = "2" }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const trade = tradeDetails[tradeId] || tradeDetails[2];
  const [activeNav, setActiveNav] = useState("/mytrades");
  const [completed, setCompleted] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);

  const goTo = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  return (
    <div className="trade-details-page">
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

      <main className="trade-details-main">
        <header className="dashboard-header">
          <div className="header-page">Minhas Trocas</div>
          <div className="header-actions">
            <button className="Notifications-button" aria-label="Notificações" onClick={() => navigate("/notifications")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>
              <i />
            </button>
            <button className="profile-button" aria-label="Perfil">
              <span className="profile-avatar marina-avatar">{user.inicial}</span>
              <strong>{user.nome}</strong>
            </button>
            <button className="create-post-button">
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Criar uma publicação
            </button>
          </div>
        </header>

        <div className="trade-details-content">
          <button
            className="details-back"
            onClick={() => navigate("/mytrades")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>{" "}
            Minhas Trocas - Detalhes troca
          </button>
          <div className="details-heading">
            <div>
              <p>
                <span className={`details-dot ${trade.statusClass}`} />{" "}
                {trade.status}{" "}
                <b>{trade.statusClass === "active" ? "Ativo" : "Atualizado"}</b>
              </p>
              <h1>{trade.title}</h1>
              <small>{trade.started}</small>
            </div>
          </div>

          <section className="trader-card">
            <div
              className="trader-avatar"
              style={{ background: trade.avatarColor }}
            >
              {trade.avatar}
            </div>
            <div>
              <strong>{trade.person}</strong>
              <small>
                <span className="stars">★★★★★</span> 4.9 · 5 trocas ·{" "}
                {trade.location}
              </small>
            </div>
            <button
              className="view-profile"
              onClick={() =>
                navigate(
                  tradeId === "4"
                    ? "/public-profile/rafael"
                    : "/public-profile/ana",
                )
              }
            >
              Ver perfil <span>→</span>
            </button>
          </section>

          <section className="exchange-card">
            <p className="exchange-label">O QUE ESTÁ SENDO TROCADO</p>
            <div className="exchange-items">
              <div className="exchange-item yours">
                <span>VOCÊ OFERECE</span>
                <strong>{trade.yours}</strong>
              </div>
              <span
                className="exchange-icon material-symbols-outlined"
                aria-hidden="true"
              >
                sync_alt
              </span>
              <div className="exchange-item theirs">
                <span>{trade.person.toUpperCase()} OFERECE</span>
                <strong>{trade.theirs}</strong>
              </div>
            </div>
            <div className="exchange-date">
              <span>DATA DA TROCA</span>
              <button>
                <span className="material-symbols-outlined" aria-hidden="true">
                  calendar_month
                </span>
                {trade.date}
              </button>
            </div>
          </section>

          <div className="details-actions">
            <button
              className="cancel-button"
              onClick={() => setCancelModal("confirm")}
            >
              Cancelar
            </button>
            <button className="talk-button" onClick={() => goTo("/chat")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                chat_bubble_outline
              </span>
              Conversar
            </button>

            <button
              className={`complete-button ${completed ? "done" : ""}`}
              onClick={() => !completed && setCompleteModal("confirm")}
            >
              {completed ? "Troca concluída" : "Concluir troca"}
            </button>
          </div>
        </div>
      </main>

      {cancelModal && (
        <div
          className="decision-overlay"
          onClick={() => cancelModal === "confirm" && setCancelModal(null)}
        >
          {cancelModal === "confirm" ? (
            <section
              className="decision-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="decision-close"
                onClick={() => setCancelModal(null)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="decision-icon refuse-icon">
                <span className="material-symbols-outlined">
                  delete_outline
                </span>
              </div>
              <h2>Cancelar esta troca?</h2>
              <p>
                Tem certeza que deseja cancelar essa troca?
                <br />
                Essa ação não poderá ser desfeita.
              </p>
              <div className="decision-actions">
                <button
                  className="decision-primary refuse-primary"
                  onClick={() => setCancelModal("success")}
                >
                  Cancelar
                </button>
                <button
                  className="decision-secondary"
                  onClick={() => setCancelModal(null)}
                >
                  Voltar
                </button>
              </div>
            </section>
          ) : (
            <section
              className="decision-modal success-decision"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="decision-icon success-icon">
                <span className="material-symbols-outlined">close</span>
              </div>
              <h2>Troca cancelada</h2>
              <p>
                A troca foi cancelada com sucesso!
                <br />
                Continue explorando outras oportunidades.
              </p>
              <button
                className="success-button"
                onClick={() => navigate("/explore")}
              >
                Explorar oportunidades
              </button>
            </section>
          )}
        </div>
      )}

      {completeModal && (
        <div
          className="decision-overlay"
          onClick={() => completeModal === "confirm" && setCompleteModal(null)}
        >
          {completeModal === "confirm" ? (
            <section
              className="decision-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="decision-close"
                onClick={() => setCompleteModal(null)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="decision-icon accept-icon">
                <span className="material-symbols-outlined">check</span>
              </div>
              <h2>Concluir esta troca?</h2>
              <p>
                Confirme que essa troca foi realizada.
                <br />
                Essa ação atualizará o status para concluída.
              </p>
              <div className="decision-actions">
                <button
                  className="decision-primary accept-primary"
                  onClick={() => {
                    setCompleteModal(null);
                    unavailable("Concluir trocas");
                  }}
                >
                  Concluir troca
                </button>
                <button
                  className="decision-secondary"
                  onClick={() => setCompleteModal(null)}
                >
                  Voltar
                </button>
              </div>
            </section>
          ) : (
            <section
              className="decision-modal success-decision"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="decision-icon success-accept-icon">
                <span className="material-symbols-outlined">check</span>
              </div>
              <h2>Troca concluída!</h2>
              <p>
                A troca foi concluída com sucesso.
                <br />
                Obrigado por fazer parte da comunidade.
              </p>
              <div className="success-decision-actions">
                <button
                  className="success-button"
                  onClick={() => navigate("/mytrades")}
                >
                  Ver minhas trocas
                </button>
                <button
                  className="success-evaluate-button"
                  onClick={() => goTo("/review")}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    star
                  </span>
                  Avaliar
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
