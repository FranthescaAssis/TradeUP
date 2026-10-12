import { useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { FormAlert } from "../components/Feedback.jsx";
import { ApiError, propostasApi, publicacoesApi } from "../services/api.js";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

// A tela recebe a publicação pela URL: /proposal?publicacao=ID (assim também funciona ao recarregar a página).
function lerIdPublicacao() {
  const id = Number(new URLSearchParams(window.location.search).get("publicacao"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Data de hoje no formato do <input type="date"> (AAAA-MM-DD), no fuso do usuário.
function hojeIso() {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export default function Proposal({ navigate }) {
  const { user, logout } = useAuth();
  const idPublicacao = lerIdPublicacao();
  const [post, setPost] = useState(null); // publicação real vinda da API
  const [previousStatus, setPreviousStatus] = useState(null); // status da proposta que o usuário já enviou, se houver
  const [loadState, setLoadState] = useState(idPublicacao ? "loading" : "error"); // "loading" | "ok" | "error"
  const [loadError, setLoadError] = useState(
    idPublicacao ? "" : "Escolha uma publicação no Explorar para enviar uma proposta.",
  );
  const [activeNavItem, setActiveNavItem] = useState("/explore");
  const [offer, setOffer] = useState("");
  const [dateType, setDateType] = useState("a_combinar"); // "unica" | "periodo" | "a_combinar"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Carrega a publicação real e o autor.
  useEffect(() => {
    if (!idPublicacao) return undefined;
    let cancelled = false;
    // Também consulta as propostas já enviadas; se essa consulta falhar, o backend continua validando o envio.
    Promise.all([
      publicacoesApi.buscar(idPublicacao),
      propostasApi.enviadas().catch(() => []),
    ])
      .then(([dados, enviadas]) => {
        if (cancelled) return;
        setPost(dados);
        setPreviousStatus(enviadas.find((p) => p.publicacao.id === dados.id)?.status || null);
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
  }, [idPublicacao]);

  const isOwn = post?.autor.id === user.id;
  const previousText = {
    recusada: "Proposta recusada. Você não pode enviar outra para esta publicação.",
    pendente: "Proposta pendente. Aguarde a resposta do autor da publicação.",
    aceita: "Proposta aceita. Você já tem uma troca com esta publicação.",
  }[previousStatus];
  const blocked = isOwn || post?.disponivel === false || Boolean(previousStatus);
  const blockedText = isOwn
    ? "Esta é a sua publicação: não é possível enviar uma proposta para ela."
    : previousStatus
      ? previousText || "Você já enviou uma proposta para esta publicação."
      : "Esta publicação não está mais disponível para propostas.";

  async function handleSend() {
    setFormError("");
    setFieldErrors({});
    setSending(true);
    try {
      // As datas são só sugestões: em "Ainda vamos combinar" nenhuma data é enviada.
      await propostasApi.enviar({
        id_publicacao: post.id,
        oferta: offer,
        mensagem: message,
        tipo_data: dateType,
        data_troca: dateType === "unica" ? singleDate || null : dateType === "periodo" ? startDate || null : null,
        data_fim: dateType === "periodo" ? endDate || null : null,
      });
      setShowSuccess(true);
    } catch (erro) {
      // Erros por campo (422) aparecem junto do campo; os demais (duplicada, indisponível, rede...) na faixa de aviso.
      setFieldErrors(erro instanceof ApiError ? erro.fieldErrors : {});
      setFormError(erro.message);
    } finally {
      setSending(false);
    }
  }

  const goTo = (path) => {
    setActiveNavItem(path);
    navigate(path);
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
            <button className="profile-button" aria-label="Perfil" onClick={() => navigate("/profile")}>
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
          <button className="proposal-back" onClick={() => navigate("/explore")}>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>{" "}
            Voltar
          </button>
          <p className="proposal-eyebrow">NOVA PROPOSTA</p>
          <h1 className="proposal-title">Enviar proposta de troca</h1>

          {loadState === "loading" && <p className="empty-explore">Carregando publicação...</p>}
          {loadState === "error" && <FormAlert kind="error">{loadError}</FormAlert>}

          {loadState === "ok" && (
            <section className="proposal-card">
              <div className="proposal-person">
                <div className="proposal-avatar">{post.autor.nome.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{post.autor.nome}</strong>
                  <small>
                    {new Date(post.data_criacao).toLocaleDateString("pt-BR")} · {post.autor.cidade}, {post.autor.estado}
                  </small>
                </div>
                <span className="offer-badge">
                  {post.tipo === "necessidade" ? "Busca" : "Oferece"}
                  <br />
                  <b>{post.categoria}</b>
                </span>
              </div>

              <div className="proposal-fieldset">
                <label>PUBLICAÇÃO</label>
                <p>
                  <strong>{post.titulo}</strong>
                  <br />
                  {post.descricao}
                </p>
              </div>

              {post.tipo === "necessidade" && post.contrapartida && (
                <div className="proposal-fieldset">
                  <label>EM TROCA, O AUTOR OFERECE</label>
                  <p>{post.contrapartida}</p>
                </div>
              )}

              {!previousStatus && (
                <>
              <div className="proposal-fieldset message-fieldset">
                <label htmlFor="proposal-offer">
                  {post.tipo === "necessidade" ? "COMO VOCÊ PODE ATENDER A ESTE PEDIDO?" : "O QUE VOCÊ OFERECE EM TROCA?"}
                </label>
                <p>
                  {post.tipo === "necessidade"
                    ? "Descreva como você pode atender à necessidade publicada."
                    : "Descreva a habilidade ou o serviço que você oferece em troca."}
                </p>
                <textarea
                  id="proposal-offer"
                  value={offer}
                  onChange={(event) => setOffer(event.target.value)}
                  maxLength={500}
                  placeholder="Ex.: Aulas de violão para iniciantes, online, uma vez por semana."
                  aria-invalid={Boolean(fieldErrors.oferta)}
                />
                {fieldErrors.oferta && <p className="field-error">{fieldErrors.oferta}</p>}
              </div>

              <div className="proposal-fieldset compact-fieldset">
                <label>QUANDO SERÁ REALIZADO?</label>
                <div className="schedule-row">
                  <label className="radio-option">
                    <input type="radio" name="when" checked={dateType === "unica"} onChange={() => setDateType("unica")} />{" "}
                    Data Única
                  </label>
                  <input
                    className="date-input"
                    type="date"
                    min={hojeIso()}
                    value={singleDate}
                    onChange={(event) => setSingleDate(event.target.value)}
                    disabled={dateType !== "unica"}
                    aria-label="Data única"
                  />
                </div>
                {dateType === "unica" && fieldErrors.data_troca && <p className="field-error">{fieldErrors.data_troca}</p>}
                <div className="period-row">
                  <label className="radio-option">
                    <input type="radio" name="when" checked={dateType === "periodo"} onChange={() => setDateType("periodo")} />{" "}
                    Período
                  </label>
                  <div className="period-dates">
                    <input
                      className="date-input"
                      type="date"
                      min={hojeIso()}
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      disabled={dateType !== "periodo"}
                      aria-label="Data inicial"
                    />
                    <input
                      className="date-input"
                      type="date"
                      min={startDate || hojeIso()}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      disabled={dateType !== "periodo"}
                      aria-label="Data final"
                    />
                  </div>
                </div>
                {dateType === "periodo" && (fieldErrors.data_troca || fieldErrors.data_fim) && (
                  <p className="field-error">{fieldErrors.data_troca || fieldErrors.data_fim}</p>
                )}
                <label className="radio-option">
                  <input type="radio" name="when" checked={dateType === "a_combinar"} onChange={() => setDateType("a_combinar")} />{" "}
                  Ainda vamos combinar
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
                  maxLength={1000}
                  placeholder="Ex.: Eu adoraria ensinar e conversar com você. Também posso compartilhar outras habilidades..."
                />
                {fieldErrors.mensagem && <p className="field-error">{fieldErrors.mensagem}</p>}
              </div>
                </>
              )}

              {blocked ? <FormAlert kind="info">{blockedText}</FormAlert> : <FormAlert kind="error">{formError}</FormAlert>}

              <button className="send-proposal" onClick={handleSend} disabled={blocked || sending}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  send
                </span>
                {sending ? "Enviando..." : "Enviar Proposta"}
              </button>
            </section>
          )}
        </div>
      </main>

      {showSuccess && (
        <div
          className="proposal-overlay"
          role="presentation"
          onClick={() => goTo("/explore")}
        >
          <div
            className="proposal-toast"
            role="status"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="toast-close"
              onClick={() => goTo("/explore")}
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
              <button onClick={() => goTo("/explore")}>
                Voltar para explorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
