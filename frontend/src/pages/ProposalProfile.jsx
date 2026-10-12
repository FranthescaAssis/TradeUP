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

const skills = ["Fotografia", "Roteiro", "Storytelling", "Excel", "Música"];
const initialLearningSkills = [
  "Inglês",
  "Design",
  "Programação",
  "Finanças",
  "Marketing",
];
const proposalTargets = {
  rafael: {
    name: "Rafael Mendes",
    initial: "R",
    city: "Rio de Janeiro, RJ",
    time: "há 5 horas",
    offers: "Programação",
  },
  ana: {
    name: "Ana Lima",
    initial: "A",
    city: "Belo Horizonte, MG",
    time: "há 1 dia",
    offers: "Design Gráfico",
  },
  beatriz: {
    name: "Beatriz Sousa",
    initial: "B",
    city: "Anápolis, GO",
    time: "há 2 horas",
    offers: "Inglês",
  },
};

export default function Proposal({ navigate, profileId = "rafael" }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const target = proposalTargets[profileId] || proposalTargets.beatriz;
  const fromProfile = profileId !== "beatriz";
  const [activeNavItem, setActiveNavItem] = useState("/explore");
  const [selectedSkill, setSelectedSkill] = useState("Fotografia");
  const [offerSkills, setOfferSkills] = useState(skills);
  const [learningSkills, setLearningSkills] = useState(initialLearningSkills);
  const [selectedLearningSkill, setSelectedLearningSkill] = useState(
    initialLearningSkills[0],
  );
  const [addingSkillTo, setAddingSkillTo] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const goTo = (path) => {
    setActiveNavItem(path);
    navigate(path);
  };

  const startAddingSkill = (type) => {
    setAddingSkillTo(type);
    setNewSkill("");
  };

  const addSkill = (event) => {
    event.preventDefault();
    const value = newSkill.trim();
    if (!value) return;
    if (addingSkillTo === "offer") {
      setOfferSkills((current) =>
        current.includes(value) ? current : [...current, value],
      );
      setSelectedSkill(value);
    } else {
      setLearningSkills((current) =>
        current.includes(value) ? current : [...current, value],
      );
      setSelectedLearningSkill(value);
    }
    setAddingSkillTo(null);
    setNewSkill("");
  };

  return (
    <div className="proposal-page">
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

      <main className="proposal-main">
        <header className="dashboard-header">
          <div className="header-page">Proposta</div>
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

        <div className="proposal-content">
          <button
            className="proposal-back"
            onClick={() => navigate("/publicprofile")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
            Voltar
          </button>
          <p className="proposal-eyebrow">NOVA PROPOSTA</p>
          <h1 className="proposal-title">Enviar proposta de troca</h1>

          <section className="proposal-card">
            <div className="proposal-person">
              <div className="proposal-avatar">{target.initial}</div>
              <div>
                <strong>{target.name}</strong>
                <small>
                  {target.time} · {target.city}
                </small>
              </div>
              <span className="offer-badge">
                Oferece
                <br />
                <b>{target.offers}</b>
              </span>
            </div>

            <div className="proposal-fieldset">
              <label>O QUE VOCÊ OFERECE</label>
              <p>
                Escolha uma das suas habilidades cadastradas ou escreva uma.
              </p>
              <div className="skill-list">
                {offerSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    className={selectedSkill === skill ? "selected" : ""}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {addingSkillTo === "offer" ? (
                <form className="add-skill-form" onSubmit={addSkill}>
                  <input
                    autoFocus
                    value={newSkill}
                    onChange={(event) => setNewSkill(event.target.value)}
                    placeholder="Digite uma habilidade"
                    aria-label="Nova habilidade oferecida"
                  />
                  <button type="submit">Adicionar</button>
                  <button type="button" onClick={() => setAddingSkillTo(null)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="add-skill"
                  onClick={() => startAddingSkill("offer")}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    add
                  </span>
                  Adicionar uma habilidade
                </button>
              )}
            </div>

            <div className="proposal-fieldset learning-fieldset">
              <label>O QUE VOCÊ QUER APRENDER</label>
              <p>
                Escolha a habilidade ou conhecimento que gostaria de receber.
              </p>
              <div className="skill-list">
                {learningSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    className={
                      selectedLearningSkill === skill ? "selected" : ""
                    }
                    onClick={() => setSelectedLearningSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {addingSkillTo === "learning" ? (
                <form className="add-skill-form" onSubmit={addSkill}>
                  <input
                    autoFocus
                    value={newSkill}
                    onChange={(event) => setNewSkill(event.target.value)}
                    placeholder="Digite uma habilidade"
                    aria-label="Nova habilidade desejada"
                  />
                  <button type="submit">Adicionar</button>
                  <button type="button" onClick={() => setAddingSkillTo(null)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="add-skill"
                  onClick={() => startAddingSkill("learning")}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    add
                  </span>
                  Adicionar uma habilidade
                </button>
              )}
            </div>

            <div className="proposal-fieldset compact-fieldset">
              <label>QUANDO SERÁ REALIZADO?</label>
              <div className="schedule-row">
                <label className="radio-option">
                  <input type="radio" name="when" defaultChecked /> Data Única
                </label>
                <input
                  className="date-input"
                  type="date"
                  defaultValue="2026-09-10"
                  aria-label="Data única"
                />
              </div>
              <div className="period-row">
                <label className="radio-option">
                  <input type="radio" name="when" /> Período
                </label>
                <div className="period-dates">
                  <input
                    className="date-input"
                    type="date"
                    defaultValue="2026-09-10"
                    aria-label="Data inicial"
                  />
                  <input
                    className="date-input"
                    type="date"
                    defaultValue="2026-09-10"
                    aria-label="Data final"
                  />
                </div>
              </div>
              <label className="radio-option">
                <input type="radio" name="when" /> Ainda vamos combinar
              </label>
            </div>

            <div className="proposal-fieldset message-fieldset">
              <label>
                MENSAGEM <span>(OPCIONAL)</span>
              </label>
              <p>Explique um pouco mais sobre o que você gostaria de trocar.</p>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ex.: Eu adoraria ensinar e conversar com você. Também posso compartilhar outras habilidades..."
              />
            </div>

            <button
              className="send-proposal"
              onClick={() => unavailable("O envio de propostas")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                send
              </span>
              Enviar Proposta
            </button>
          </section>
        </div>
      </main>

      {showSuccess && (
        <div
          className="proposal-overlay"
          role="presentation"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="proposal-toast"
            role="status"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="toast-close"
              onClick={() => setShowSuccess(false)}
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
            <div className="toast-check">
              <span className="material-symbols-outlined" aria-hidden="true">
                check
              </span>
            </div>
            <h2>Proposta enviada!</h2>
            <p>
              Sua proposta foi enviada.
              <br />
              Agora é só aguardar a resposta.
            </p>
            <div className="toast-actions">
              <button onClick={() => goTo("/mytrades")}>
                Ver minhas trocas
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  goTo("/explore");
                }}
              >
                Voltar para explorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
