import { useEffect, useRef, useState } from "react";

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

const notificationOptions = [
  {
    key: "proposals",
    title: "Novas propostas",
    description: "Quando alguém enviar uma proposta de troca para você",
  },
  {
    key: "messages",
    title: "Mensagens",
    description: "Quando você receber uma nova mensagem no chat",
  },
  {
    key: "reviews",
    title: "Avaliações recebidas",
    description: "Quando alguém deixar uma avaliação no seu perfil",
  },
  {
    key: "platform",
    title: "Atualizações da plataforma",
    description: "Novidades, melhorias e comunicados do TradeUp",
  },
];

const privacyOptions = [
  {
    key: "publicProfile",
    title: "Perfil público",
    description: "Qualquer pessoa pode ver seu perfil e publicações",
  },
  {
    key: "showLocation",
    title: "Mostrar localização",
    description: "Sua cidade aparece nas suas publicações",
  },
  {
    key: "directProposals",
    title: "Permitir propostas diretas",
    description:
      "Outros usuários podem enviar propostas sem você publicar primeiro",
  },
];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function ToggleList({ options, values, onToggle }) {
  return (
    <div className="st-card st-toggle-list">
      {options.map((option) => (
        <div className="st-toggle-row" key={option.key}>
          <div>
            <strong id={`st-${option.key}-label`}>{option.title}</strong>
            <small>{option.description}</small>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={values[option.key]}
            aria-labelledby={`st-${option.key}-label`}
            className={`st-switch ${values[option.key] ? "on" : ""}`}
            onClick={() => onToggle(option.key)}
          >
            <span />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeleteAccountModal({ onClose, onConfirm }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="st-overlay" onClick={onClose}>
      <div
        className="st-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="st-delete-title"
        aria-describedby="st-delete-text"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="st-modal-icon">
          <span className="material-symbols-outlined" aria-hidden="true">
            warning
          </span>
        </div>

        <h2 id="st-delete-title">Excluir conta?</h2>

        <p id="st-delete-text">
          Essa ação não pode ser desfeita. Seu perfil, suas publicações e suas
          trocas serão removidos permanentemente.
        </p>

        <div className="st-modal-actions">
          <button type="button" className="st-cancel-button" onClick={onClose}>
            Cancelar
          </button>

          <button type="button" className="st-danger-solid" onClick={onConfirm}>
            Sim, excluir conta
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings({ navigate }) {
  const { user, logout } = useAuth();
  const { unavailable } = useFeedback();
  const [activeNavItem, setActiveNavItem] = useState("/settings");

  const [name, setName] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saved, setSaved] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");

  const [notifications, setNotifications] = useState({
    proposals: true,
    messages: true,
    reviews: true,
    platform: false,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showLocation: true,
    directProposals: true,
  });

  const [showDelete, setShowDelete] = useState(false);

  const fileInputRef = useRef(null);
  const photoUrlRef = useRef("");
  const savedTimerRef = useRef(null);
  const passwordTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    };
  }, []);

  const goTo = (path) => {
    setActiveNavItem(path);
    if (path !== "/settings") navigate(path);
  };

  const setPhoto = (url) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = url;
    setPhotoUrl(url);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Use uma imagem JPG, PNG ou GIF.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setPhotoError("");
    setPhoto(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoError("");
    setPhoto("");
  };

  const handleSaveAccount = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const nextNameError = trimmedName ? "" : "Informe o seu nome completo.";
    const nextEmailError = EMAIL_PATTERN.test(trimmedEmail)
      ? ""
      : "Informe um e-mail válido.";

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setSaved(false);

    if (nextNameError || nextEmailError) return;

    unavailable("A alteração dos dados da conta");
  };

  const handleChangePassword = () => {
    setPasswordSaved(false);

    if (password.length < MIN_PASSWORD) {
      setPasswordError(
        `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`,
      );
      return;
    }

    setPasswordError("");
    unavailable("A troca de senha");
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleChangePassword();
    }
  };

  const toggleNotification = () => {
    unavailable("As preferências de notificação");
  };

  const togglePrivacy = () => {
    unavailable("As configurações de privacidade");
  };

  const handleDeleteAccount = () => {
    setShowDelete(false);
    unavailable("A exclusão de conta");
  };

  const initial = name.trim().charAt(0).toUpperCase() || user.inicial;

  return (
    <div className="explore settings-page">
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
          <div className="header-page">Configurações</div>

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

        <div className="explore-content st-content">
          <section aria-labelledby="st-account-title">
            <h1 id="st-account-title" className="st-title">
              Conta
            </h1>
            <p className="st-subtitle">
              Gerencie suas informações pessoais e credenciais.
            </p>

            <form className="st-card" onSubmit={handleSaveAccount} noValidate>
              <div className="st-photo">
                <div className="st-photo-avatar">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Nova foto de perfil" />
                  ) : (
                    initial
                  )}
                </div>

                <div className="st-photo-info">
                  <strong>{name.trim() || "Seu nome"}</strong>
                  <small>JPG, PNG ou GIF. Tamanho máximo 5MB.</small>

                  <div className="st-photo-actions">
                    <button
                      type="button"
                      className="st-outline-button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        upload
                      </span>
                      Alterar Foto
                    </button>

                    <button
                      type="button"
                      className="st-link-button"
                      onClick={handleRemovePhoto}
                      disabled={!photoUrl}
                    >
                      Remover
                    </button>
                  </div>

                  {photoError && (
                    <p className="st-error" role="alert">
                      {photoError}
                    </p>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handlePhotoChange}
                  hidden
                />
              </div>

              <div className="st-row">
                <div className="st-field">
                  <label htmlFor="st-name">Nome completo</label>
                  <input
                    id="st-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(nameError)}
                    maxLength={60}
                  />
                  {nameError && (
                    <p className="st-error" role="alert">
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="st-field">
                  <label htmlFor="st-email">E-mail</label>
                  <input
                    id="st-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(emailError)}
                  />
                  {emailError && (
                    <p className="st-error" role="alert">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>

              <div className="st-field">
                <label htmlFor="st-password">Senha</label>

                <div className="st-password-row">
                  <div className="st-password-wrap">
                    <input
                      id="st-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                        setPasswordSaved(false);
                      }}
                      onKeyDown={handlePasswordKeyDown}
                      placeholder="Digite a nova senha"
                      autoComplete="new-password"
                      aria-invalid={Boolean(passwordError)}
                    />

                    <button
                      type="button"
                      className="st-password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="st-outline-button st-outline-small"
                    onClick={handleChangePassword}
                    disabled={!password}
                  >
                    Alterar senha
                  </button>
                </div>

                {passwordError && (
                  <p className="st-error" role="alert">
                    {passwordError}
                  </p>
                )}

                {passwordSaved && (
                  <p className="st-success st-success-left" role="status">
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                    Senha alterada com sucesso!
                  </p>
                )}
              </div>

              <button type="submit" className="st-save-button">
                Salvar Alterações
                <span className="material-symbols-outlined" aria-hidden="true">
                  save
                </span>
              </button>

              {saved && (
                <p className="st-success" role="status">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  Alterações salvas com sucesso!
                </p>
              )}
            </form>
          </section>

          {/* ---------- Notificações ---------- */}
          <section aria-labelledby="st-notifications-title">
            <h2 id="st-notifications-title" className="st-title">
              Notificações
            </h2>
            <p className="st-subtitle">
              Escolha quais avisos você quer receber.
            </p>

            <ToggleList
              options={notificationOptions}
              values={notifications}
              onToggle={toggleNotification}
            />
          </section>

          {/* ---------- Privacidade ---------- */}
          <section aria-labelledby="st-privacy-title">
            <h2 id="st-privacy-title" className="st-title">
              Privacidade
            </h2>
            <p className="st-subtitle">
              Controle quem pode ver e interagir com você.
            </p>

            <ToggleList
              options={privacyOptions}
              values={privacy}
              onToggle={togglePrivacy}
            />
          </section>

          <section aria-labelledby="st-delete-section-title">
            <h2
              id="st-delete-section-title"
              className="st-title st-title-danger"
            >
              Excluir Conta
            </h2>
            <p className="st-subtitle">
              Ao excluir sua conta, todos os seus dados serão removidos
              permanentemente.
            </p>

            <div className="st-card st-danger-card">
              <div>
                <strong>Excluir minha conta</strong>
                <small>Essa ação não pode ser desfeita.</small>
              </div>

              <button
                type="button"
                className="st-danger-button"
                onClick={() => setShowDelete(true)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  delete
                </span>
                Excluir conta
              </button>
            </div>
          </section>
        </div>
      </main>

      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}
