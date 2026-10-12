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

export default function ReceivedProposal({ navigate }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const [activeNav, setActiveNav] = useState("/mytrades");
  const [dateChoice, setDateChoice] = useState("yes");
  const [result, setResult] = useState("");
  const [decisionModal, setDecisionModal] = useState(null);

  const goTo = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  return (
    <div className="received-proposal-page">
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

      <main className="received-proposal-main">
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

        <div className="received-proposal-content">
          <button
            className="received-back"
            onClick={() => navigate("/mytrades")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>{" "}
            Voltar para Minhas Trocas
          </button>
          <p className="received-eyebrow">NOVA PROPOSTA</p>
          <h1 className="received-title">Você recebeu uma proposta</h1>
          <p className="received-subtitle">
            Revise os detalhes antes de aceitar ou recusar.
          </p>

          <section className="received-person-card">
            <div className="received-person-avatar">R</div>
            <div>
              <strong>Rafael Mendes</strong>
              <small>
                <span className="received-stars">★★★★★</span> 4.7 · 8 trocas ·
                Rio de Janeiro
              </small>
            </div>
            <button onClick={() => navigate("/publicprofile")}>
              Ver perfil <span>→</span>
            </button>
          </section>

          <section className="received-exchange-card">
            <p className="received-section-label">DETALHES DA TROCA</p>
            <div className="received-exchange-row">
              <div className="received-offer offer-purple">
                <span>ELE OFERECE</span>
                <strong>Programação</strong>
              </div>
              <span
                className="material-symbols-outlined received-swap"
                aria-hidden="true"
              >
                sync_alt
              </span>
              <div className="received-offer offer-neutral">
                <span>ELE QUER</span>
                <strong>Aulas de Storytelling</strong>
              </div>
            </div>
          </section>

          <section className="received-date-card">
            <div>
              <p className="received-section-label">DATA DA TROCA</p>
              <button className="received-date">
                <span className="material-symbols-outlined" aria-hidden="true">
                  calendar_month
                </span>
                10/09/2026
              </button>
            </div>
            <div className="date-divider" />
            <div className="date-question">
              <strong>Essa data funciona para você?</strong>
              <div>
                <button
                  className={dateChoice === "yes" ? "chosen" : ""}
                  onClick={() => setDateChoice("yes")}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    check
                  </span>
                  Sim, funciona para mim
                </button>
                <button
                  className={dateChoice === "other" ? "chosen" : ""}
                  onClick={() => setDateChoice("other")}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    chat_bubble_outline
                  </span>
                  Combinar outra data
                </button>
              </div>
            </div>
          </section>

          <section className="received-message-card">
            <p className="received-section-label">MENSAGEM</p>
            <p>
              Oi, Marina! Vi o seu perfil e acho que podemos nos ajudar. 😊
              Estou buscando aprimorar minhas habilidades de storytelling e
              acredito que você possa me ajudar com isso. Em troca, posso
              oferecer aulas de programação. O que acha?
            </p>
          </section>

          {result && (
            <div
              className={`proposal-result ${result === "accepted" ? "accepted" : "refused"}`}
            >
              <span className="material-symbols-outlined">
                {result === "accepted" ? "check_circle" : "info"}
              </span>
              {result === "accepted"
                ? "Proposta aceita com sucesso!"
                : "Proposta recusada."}
            </div>
          )}
          <div className="received-actions">
            <button
              className="refuse-button"
              onClick={() => setDecisionModal("refuse-confirm")}
            >
              Recusar proposta
            </button>
            <button className="details-button" onClick={() => goTo("/chat")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                chat_bubble_outline
              </span>
              Pedir mais detalhes
            </button>
            <button
              className="accept-button"
              onClick={() => setDecisionModal("accept-confirm")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                check
              </span>
              Aceitar proposta
            </button>
          </div>
        </div>
      </main>

      {decisionModal && (
        <div
          className="decision-overlay"
          onClick={() =>
            decisionModal.endsWith("confirm") && setDecisionModal(null)
          }
        >
          {decisionModal === "refuse-confirm" && (
            <section
              className="decision-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="decision-close"
                onClick={() => setDecisionModal(null)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="decision-icon refuse-icon">
                <span className="material-symbols-outlined">close</span>
              </div>
              <h2>Recusar esta proposta?</h2>
              <p>
                Tem certeza que deseja recusar esta proposta?
                <br />
                Essa ação não poderá ser desfeita.
              </p>
              <div className="decision-actions">
                <button
                  className="decision-primary refuse-primary"
                  onClick={() => {
                    setDecisionModal(null);
                    unavailable("Recusar propostas");
                  }}
                >
                  Recusar proposta
                </button>
                <button
                  className="decision-secondary"
                  onClick={() => setDecisionModal(null)}
                >
                  Voltar
                </button>
              </div>
            </section>
          )}
          {decisionModal === "accept-confirm" && (
            <section
              className="decision-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="decision-close"
                onClick={() => setDecisionModal(null)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="decision-icon accept-icon">
                <span className="material-symbols-outlined">check</span>
              </div>
              <h2>Aceitar esta proposta?</h2>
              <p>
                Confirme que você deseja aceitar esta troca.
                <br />A combinação será adicionada às suas trocas.
              </p>
              <div className="decision-actions">
                <button
                  className="decision-primary accept-primary"
                  onClick={() => {
                    setDecisionModal(null);
                    unavailable("Aceitar propostas");
                  }}
                >
                  Aceitar proposta
                </button>
                <button
                  className="decision-secondary"
                  onClick={() => setDecisionModal(null)}
                >
                  Voltar
                </button>
              </div>
            </section>
          )}
          {decisionModal === "refuse-success" && (
            <section
              className="decision-modal success-decision"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="decision-icon success-icon">
                <span className="material-symbols-outlined">close</span>
              </div>
              <h2>Proposta recusada</h2>
              <p>
                A proposta foi recusada com sucesso.
                <br />
                Você pode continuar explorando novas trocas.
              </p>
              <button
                className="success-button"
                onClick={() => goTo("/explore")}
              >
                Explorar oportunidades
              </button>
            </section>
          )}
          {decisionModal === "accept-success" && (
            <section
              className="decision-modal success-decision"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="decision-icon success-accept-icon">
                <span className="material-symbols-outlined">check</span>
              </div>
              <h2>Proposta aceita!</h2>
              <p>
                A troca foi adicionada às suas combinações.
                <br />
                Agora é só combinar os próximos passos.
              </p>
              <button
                className="success-button"
                onClick={() => goTo("/mytrades")}
              >
                Ver minhas trocas
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
