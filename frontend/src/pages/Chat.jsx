import { useEffect, useMemo, useRef, useState } from "react";

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

const initialConversations = [
  {
    id: "beatriz",
    name: "Beatriz Souza",
    avatar: "B",
    color: "#dfaa8c",
    online: true,
    time: "10:32",
    messages: [
      {
        id: 1,
        from: "them",
        text: "Oi, Marina! Vi que você procura aulas de Inglês. Posso te ajudar com conversação.",
        time: "09:26",
      },
      {
        id: 2,
        from: "me",
        text: "Oi, Beatriz! Perfeito. Em troca, posso editar um vídeo curto para você.",
        time: "12:15",
      },
      {
        id: 3,
        from: "them",
        text: "Combinado! Até sexta então.",
        time: "16:02",
      },
    ],
  },
  {
    id: "gustavo",
    name: "Gustavo Lima",
    avatar: "G",
    color: "#c8c0f0",
    online: false,
    time: "Ontem",
    messages: [
      {
        id: 1,
        from: "me",
        text: "Oi, Gustavo! Podemos combinar a edição do vídeo?",
        time: "14:10",
      },
      {
        id: 2,
        from: "them",
        text: "Te enviei uma referência.",
        time: "14:32",
      },
    ],
  },
  {
    id: "ana",
    name: "Ana Clara",
    avatar: "A",
    color: "#f7b6d2",
    online: false,
    time: "Seg",
    messages: [
      {
        id: 1,
        from: "me",
        text: "Oi, Ana! Enviei uma proposta de troca.",
        time: "10:00",
      },
      {
        id: 2,
        from: "them",
        text: "Obrigada pela proposta!",
        time: "11:45",
      },
    ],
  },
];

const nowTime = () =>
  new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Chat({ navigate }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const [activeNavItem, setActiveNavItem] = useState("/chat");
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState("beatriz");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const goTo = (path) => {
    setActiveNavItem(path);
    if (path !== "/chat") navigate(path);
  };

  const activeConversation = conversations.find((item) => item.id === activeId);

  const visibleConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((item) => {
      const last = item.messages[item.messages.length - 1];
      return `${item.name} ${last?.text ?? ""}`.toLowerCase().includes(term);
    });
  }, [conversations, search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeId, activeConversation?.messages.length]);

  const handleSend = (event) => {
    event.preventDefault();

    if (!draft.trim()) return;
    // O texto digitado é mantido: nada foi enviado.
    unavailable("O envio de mensagens");
  };

  return (
    <div className="explore chat-page">
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
          <div className="header-page">Mensagens</div>

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

        <div className="chat-layout">
          <section className="chat-list" aria-label="Conversas">
            <label className="chat-search">
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar conversa"
              />

              <button
                type="button"
                aria-label="Filtrar conversas"
                className="chat-icon-button"
              ></button>
            </label>

            <ul>
              {visibleConversations.map((item) => {
                const last = item.messages[item.messages.length - 1];

                return (
                  <li key={item.id}>
                    <button
                      className={`chat-item ${
                        item.id === activeId ? "active" : ""
                      }`}
                      onClick={() => setActiveId(item.id)}
                    >
                      <span
                        className="chat-avatar"
                        style={{ background: item.color }}
                      >
                        {item.avatar}
                      </span>

                      <span className="chat-item-info">
                        <strong>{item.name}</strong>
                        <small>{last?.text}</small>
                      </span>

                      <span className="chat-item-time">{item.time}</span>
                    </button>
                  </li>
                );
              })}

              {!visibleConversations.length && (
                <li className="chat-empty">Nenhuma conversa encontrada.</li>
              )}
            </ul>
          </section>

          {activeConversation && (
            <section className="chat-window" aria-label="Conversa">
              <header className="chat-window-header">
                <span
                  className="chat-avatar"
                  style={{ background: activeConversation.color }}
                >
                  {activeConversation.avatar}
                </span>

                <div>
                  <strong>{activeConversation.name}</strong>

                  {activeConversation.online && (
                    <small className="chat-online">
                      <i /> Online agora
                    </small>
                  )}
                </div>
              </header>

              <div className="chat-messages">
                <div className="chat-day">
                  <span>Hoje</span>
                </div>

                {activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${
                      message.from === "me" ? "mine" : "theirs"
                    }`}
                  >
                    <p>{message.text}</p>

                    <small>
                      {message.time}
                      {message.from === "me" && (
                        <span
                          className="material-symbols-outlined"
                          aria-label="Enviada"
                        >
                          done_all
                        </span>
                      )}
                    </small>
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>

              <form className="chat-composer" onSubmit={handleSend}>
                <button
                  type="button"
                  className="chat-add-button"
                  aria-label="Adicionar"
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    add
                  </span>
                </button>

                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Digite uma mensagem..."
                  aria-label="Mensagem"
                />

                <button
                  type="submit"
                  className="chat-send-button"
                  aria-label="Enviar mensagem"
                  disabled={!draft.trim()}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    send
                  </span>
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
