import { useState } from "react";

import { useAuth } from "./auth/AuthContext.jsx";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

const initialNotifications = [
  {
    id: 1,
    title: "Nova proposta recebida",
    text: "Rafael Mendes enviou uma proposta de troca para Programação.",
    time: "agora",
    action: "Ver proposta",
    path: "/receivedproposal",
    unread: true,
  },
  {
    id: 2,
    title: "Troca concluída!",
    text: "Sua troca de Edição de Vídeo com Gustavo Lima foi concluída. Avalie sua experiência.",
    time: "há 2h",
    action: "Avaliar",
    path: "/review",
    unread: true,
  },
  {
    id: 3,
    title: "Nova mensagem",
    text: "Ana Clara: 'Obrigada pela proposta! Podemos combinar mais detalhes?'",
    time: "ontem",
    action: "Abrir chat",
    path: "/chat",
    unread: true,
  },
  {
    id: 4,
    title: "Proposta aceita!",
    text: "João aceitou sua proposta de troca de Fotografia.",
    time: "há 3 dias",
    action: "Ver proposta",
    path: "/tradedetails",
    unread: false,
  },
];

export default function Notifications({ navigate }) {
  const { user, logout } = useAuth();
  const [activeNavItem, setActiveNavItem] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const goTo = (path) => {
    setActiveNavItem(path);
    navigate(path);
  };

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id && item.unread ? { ...item, unread: false } : item,
      ),
    );
    // TODO: avisar a API
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    );
    // TODO: avisar a API
  };

  const openNotification = (item) => {
    markAsRead(item.id);
    navigate(item.path);
  };

  return (
    <div className="explore notifications-page">
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
          <div className="header-page">Notificações</div>

          <div className="header-actions">
            <button className="Notifications-button" aria-label="Notificações" onClick={() => navigate("/notifications")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>

              {unreadCount > 0 && <i />}
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

        <div className="explore-content nt-content">
          <div className="nt-heading">
            <div>
              <p className="nt-eyebrow">CENTRAL</p>

              <h1 className="nt-title">
                Notificações
                {unreadCount > 0 && (
                  <span
                    className="nt-count"
                    aria-label={`${unreadCount} não lidas`}
                  >
                    {unreadCount}
                  </span>
                )}
              </h1>
            </div>

            <button
              type="button"
              className="nt-mark-all"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Marcar todas como lidas
            </button>
          </div>

          <ul className="nt-list">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`nt-card ${item.unread ? "unread" : ""}`}
              >
                <div className="nt-card-main">
                  <div className="nt-card-title">
                    <strong>{item.title}</strong>

                    {item.unread && (
                      <button
                        type="button"
                        className="nt-dot"
                        onClick={() => markAsRead(item.id)}
                        aria-label="Marcar como lida"
                        title="Marcar como lida"
                      />
                    )}
                  </div>

                  <p>{item.text}</p>
                </div>

                <div className="nt-card-side">
                  <small>{item.time}</small>

                  <button
                    type="button"
                    className="nt-action"
                    onClick={() => openNotification(item)}
                  >
                    {item.action}
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {!notifications.length && (
            <p className="nt-empty">Você não tem notificações.</p>
          )}
        </div>
      </main>
    </div>
  );
}
