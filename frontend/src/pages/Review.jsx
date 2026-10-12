import { useEffect, useState } from "react";

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

const highlights = [
  "Pontual",
  "Comunicativo",
  "Ótima qualidade",
  "Recomendo",
  "Atencioso",
  "Didático",
];

const reportReasons = [
  "A troca não foi realizada",
  "Comportamento inadequado",
  "Cancelamento ou desistência prévia",
  "A pessoa não cumpriu o combinado",
  "Outro",
];

const trade = {
  partner: "Gustavo Lima",
  service: "Edição de Vídeo",
  avatar: "G",
  color: "#a7c5dc",
};

function SuccessModal({ title, children, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="rv-overlay" onClick={onClose}>
      <div
        className="rv-modal rv-modal-success"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rv-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rv-success-icon">
          <span className="material-symbols-outlined" aria-hidden="true">
            check
          </span>
        </div>

        <h2 id="rv-success-title" className="rv-modal-title">
          {title}
        </h2>

        <p className="rv-success-text">{children}</p>

        <button type="button" className="rv-primary-button" onClick={onClose}>
          Ok
        </button>
      </div>
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!reason) return;
    onSubmit({ reason, details: details.trim() });
  };

  return (
    <div className="rv-overlay" onClick={onClose}>
      <form
        className="rv-modal rv-modal-report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rv-report-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="rv-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 id="rv-report-title" className="rv-modal-title">
          Denunciar troca
        </h2>

        <h3 className="rv-report-question">O que aconteceu?</h3>
        <p className="rv-report-help">
          Nos conte o que aconteceu para podermos analisar.
        </p>

        <div className="rv-reasons" role="radiogroup">
          {reportReasons.map((item) => (
            <label key={item} className="rv-reason">
              <input
                type="radio"
                name="report-reason"
                value={item}
                checked={reason === item}
                onChange={() => setReason(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>

        <h3 className="rv-report-describe">Descreva o ocorrido (OPCIONAL)</h3>

        <textarea
          className="rv-textarea"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Conte o que aconteceu..."
          rows={4}
        />

        <div className="rv-modal-actions">
          <button
            type="button"
            className="rv-secondary-button"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="rv-primary-button"
            disabled={!reason}
          >
            Enviar denúncia
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Reviews({ navigate }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const [activeNavItem, setActiveNavItem] = useState("/review");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  const goTo = (path) => {
    setActiveNavItem(path);
    if (path !== "/review") navigate(path);
  };

  const toggleHighlight = (item) => {
    setSelectedHighlights((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  };

  const handleSubmitReview = (event) => {
    event.preventDefault();

    if (!rating) {
      setRatingError(true);
      return;
    }

    unavailable("O envio de avaliações");
  };

  const handleSubmitReport = (report) => {
    setShowReport(false);
    unavailable("O envio de denúncias");
  };

  const handleReviewSuccessClose = () => {
    setShowReviewSuccess(false);
    navigate("/mytrades");
  };

  const displayedRating = hoverRating || rating;

  return (
    <div className="explore reviews-page">
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
          <div className="header-page">Avaliações</div>

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
          <form className="rv-card" onSubmit={handleSubmitReview} noValidate>
            <h1 className="rv-title">Avaliar Troca</h1>

            <p className="rv-subtitle">
              Parabéns pela conclusão! Sua avaliação ajuda a manter a comunidade
              TradeUp segura e confiável.
            </p>

            <div className="rv-trade">
              <div
                className="rv-trade-avatar"
                style={{ background: trade.color }}
              >
                {trade.avatar}
              </div>

              <div className="rv-trade-info">
                <small>VOCÊ TROCOU COM</small>
                <strong>{trade.partner}</strong>
                <span>{trade.service}</span>
              </div>

              <span className="rv-badge">Concluída</span>
            </div>

            <div className="rv-rating">
              <p>Sua nota:</p>

              <div
                className="rv-stars"
                role="radiogroup"
                aria-label="Sua nota de 1 a 5"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                    className={`rv-star ${value <= displayedRating ? "filled" : ""}`}
                    onMouseEnter={() => setHoverRating(value)}
                    onClick={() => {
                      setRating(value);
                      setRatingError(false);
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>

              {ratingError && (
                <p className="rv-error" role="alert">
                  Selecione uma nota para enviar a avaliação.
                </p>
              )}
            </div>

            <h3 className="rv-label">Destaques positivos (Opcional)</h3>

            <div className="rv-chips">
              {highlights.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={selectedHighlights.includes(item) ? "active" : ""}
                  aria-pressed={selectedHighlights.includes(item)}
                  onClick={() => toggleHighlight(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="rv-label" htmlFor="rv-comment">
              Como foi sua experiência?
            </label>

            <textarea
              id="rv-comment"
              className="rv-textarea"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Conte como foi a troca..."
              rows={4}
            />

            <button type="submit" className="rv-primary-button rv-submit">
              Enviar Avaliação
            </button>

            <button
              type="button"
              className="rv-report-button"
              onClick={() => setShowReport(true)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                warning
              </span>
              Denunciar troca
            </button>
          </form>
        </div>
      </main>

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onSubmit={handleSubmitReport}
        />
      )}

      {showReportSuccess && (
        <SuccessModal
          title="Denúncia enviada!"
          onClose={() => setShowReportSuccess(false)}
        >
          Obrigada por nos avisar!
          <br />
          Iremos avaliar o caso e tomar as medidas necessárias.
        </SuccessModal>
      )}

      {showReviewSuccess && (
        <SuccessModal
          title="Avaliação enviada!"
          onClose={handleReviewSuccessClose}
        >
          Obrigada por avaliar!
          <br />
          Sua opinião ajuda a manter a comunidade TradeUp confiável.
        </SuccessModal>
      )}
    </div>
  );
}
