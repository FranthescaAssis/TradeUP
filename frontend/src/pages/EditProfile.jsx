import { useEffect, useRef, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { FormAlert } from "../components/Feedback.jsx";
import { validarNome } from "../auth/validation.js";
import { authApi, localidadesApi } from "../services/api.js";
const asset = (name) => `/assets/${name}`;

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const MAX_ABOUT = 200;
const MAX_SKILLS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"];

function SkillEditor({ id, label, items, onChange, variant, error }) {
  const [value, setValue] = useState("");
  const limitReached = items.length >= MAX_SKILLS;

  const addSkill = () => {
    const skill = value.replace(/\s+/g, " ").trim();
    if (!skill || limitReached) return;

    const exists = items.some(
      (item) => item.toLowerCase() === skill.toLowerCase(),
    );

    if (!exists) onChange([...items, skill]);
    setValue("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="ep-skill-group">
      <label htmlFor={id} className="ep-label">
        {label}
      </label>

      <div className="ep-skill-list">
        {items.map((skill) => (
          <span key={skill} className={`ep-skill ${variant}`}>
            {skill}
            <button
              type="button"
              onClick={() => onChange(items.filter((item) => item !== skill))}
              aria-label={`Remover ${skill}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </span>
        ))}

        {!items.length && (
          <span className="ep-skill-empty">Nenhuma habilidade adicionada.</span>
        )}
      </div>

      <div className="ep-skill-add">
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            limitReached
              ? `Limite de ${MAX_SKILLS} habilidades`
              : "Digite e pressione Enter"
          }
          disabled={limitReached}
          maxLength={30}
        />

        <button
          type="button"
          onClick={addSkill}
          disabled={!value.trim() || limitReached}
        >
          Adicionar
        </button>
      </div>

      {error && (
        <p className="ep-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EditProfile({ navigate }) {
  const { user, logout, updateUser } = useAuth();
  const [activeNavItem, setActiveNavItem] = useState("/settings");

  const [name, setName] = useState(user.nome);
  const [state, setState] = useState(user.estado ?? "");
  const [city, setCity] = useState(user.cidade ?? "");
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState("");
  const [citiesTry, setCitiesTry] = useState(0);
  const [about, setAbout] = useState(user.descricao ?? "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [offered, setOffered] = useState(user.oferece ?? []);
  const [looking, setLooking] = useState(user.procura ?? []);

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef(null);
  const photoUrlRef = useRef("");
  const redirectRef = useRef(null);

  // Libera a URL temporária da foto e o timer ao sair da tela
  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      if (redirectRef.current) clearTimeout(redirectRef.current);
    };
  }, []);

  // Cidades do estado escolhido (a mesma lista local usada no cadastro).
  useEffect(() => {
    if (!state) return undefined;
    let cancelled = false;
    setCitiesLoading(true);
    setCitiesError("");
    localidadesApi
      .cidades(state)
      .then((list) => {
        if (!cancelled) setCities(list);
      })
      .catch(() => {
        if (!cancelled) setCitiesError("Não foi possível carregar as cidades.");
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state, citiesTry]);

  const handleStateChange = (event) => {
    setState(event.target.value);
    setCity("");
    setCities([]);
    setFieldErrors((current) => ({ ...current, estado: "", cidade: "" }));
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || saved) return;

    const errors = {};
    const nameProblem = validarNome(name);
    if (nameProblem) errors.nome = nameProblem;
    if (!state) errors.estado = "Informe o estado (UF).";
    if (!city) errors.cidade = "Selecione a cidade.";
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      // O e-mail não é enviado: ele só é exibido.
      const atualizado = await authApi.atualizarPerfil({ nome: name, estado: state, cidade: city, descricao: about, oferece: offered, procura: looking });
      updateUser(atualizado);
      setSaved(true);
      redirectRef.current = setTimeout(() => navigate("/profile"), 1200);
    } catch (erro) {
      setFieldErrors(erro.fieldErrors ?? {});
      setFormError(erro.message);
    } finally {
      setSaving(false);
    }
  };

  const initial = name.trim().charAt(0).toUpperCase() || user.inicial;

  return (
    <div className="explore edit-profile-page">
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
          <div className="header-page">Perfil</div>

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
          <button
            type="button"
            className="ep-back"
            onClick={() => navigate("/profile")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
            Voltar ao Perfil
          </button>

          <p className="ep-eyebrow">CONFIGURAÇÕES</p>
          <h1 className="ep-title">Editar Perfil</h1>

          <form className="ep-form" onSubmit={handleSubmit} noValidate>
            {/* ---------- Foto de perfil ---------- */}
            <section className="ep-card">
              <h2 className="ep-card-title">FOTO DE PERFIL</h2>

              <small className="ep-counter">Demonstrativo: a foto ainda não é salva nesta versão.</small>

              <div className="ep-photo">
                <div className="ep-photo-avatar">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Nova foto de perfil" />
                  ) : (
                    initial
                  )}
                </div>

                <div className="ep-photo-info">
                  <strong>{name.trim() || "Seu nome"}</strong>
                  <small>JPG, PNG ou GIF. Tamanho máximo 5MB.</small>

                  <div className="ep-photo-actions">
                    <button
                      type="button"
                      className="ep-outline-button"
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
                      className="ep-link-button"
                      onClick={handleRemovePhoto}
                      disabled={!photoUrl}
                    >
                      Remover
                    </button>
                  </div>

                  {photoError && (
                    <p className="ep-error" role="alert">
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
            </section>

            {/* ---------- Informações pessoais ---------- */}
            <section className="ep-card">
              <h2 className="ep-card-title">INFORMAÇÕES PESSOAIS</h2>

              <div className="ep-row">
                <div className="ep-field">
                  <label htmlFor="ep-name" className="ep-label">
                    Nome completo
                  </label>
                  <input
                    id="ep-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.nome)}
                    maxLength={100}
                  />
                  {fieldErrors.nome && (
                    <p className="ep-error" role="alert">
                      {fieldErrors.nome}
                    </p>
                  )}
                </div>

                <div className="ep-field">
                  <label htmlFor="ep-email" className="ep-label">
                    E-mail
                  </label>
                  <input id="ep-email" value={user.email} readOnly />
                </div>
              </div>

              <div className="ep-row">
                <div className="ep-field">
                  <label htmlFor="ep-state" className="ep-label">
                    Estado (UF)
                  </label>
                  <select
                    id="ep-state"
                    value={state}
                    onChange={handleStateChange}
                    aria-invalid={Boolean(fieldErrors.estado)}
                  >
                    <option value="">Selecione</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.estado && (
                    <p className="ep-error" role="alert">
                      {fieldErrors.estado}
                    </p>
                  )}
                </div>

                <div className="ep-field">
                  <label htmlFor="ep-city" className="ep-label">
                    Cidade
                  </label>
                  <select
                    id="ep-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    disabled={!state || citiesLoading || Boolean(citiesError)}
                    aria-invalid={Boolean(fieldErrors.cidade)}
                  >
                    <option value="">
                      {!state ? "Escolha o estado primeiro" : citiesLoading ? "Carregando..." : "Selecione a cidade"}
                    </option>
                    {cities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.cidade && (
                    <p className="ep-error" role="alert">
                      {fieldErrors.cidade}
                    </p>
                  )}
                  {citiesError && (
                    <p className="ep-error" role="alert">
                      {citiesError}{" "}
                      <button type="button" className="ep-link-button" onClick={() => setCitiesTry((n) => n + 1)}>
                        Tentar novamente
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <div className="ep-field">
                <label htmlFor="ep-about" className="ep-label">
                  Sobre mim
                </label>
                <textarea
                  id="ep-about"
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  maxLength={MAX_ABOUT}
                  rows={5}
                  aria-invalid={Boolean(fieldErrors.descricao)}
                />
                {fieldErrors.descricao && (
                  <p className="ep-error" role="alert">
                    {fieldErrors.descricao}
                  </p>
                )}
                <small className="ep-counter">
                  {about.length}/{MAX_ABOUT} caracteres
                </small>
              </div>
            </section>

            {/* ---------- Habilidades ---------- */}
            <section className="ep-card">
              <h2 className="ep-card-title">HABILIDADES</h2>

              <SkillEditor
                id="ep-offered"
                label="O que você oferece"
                items={offered}
                onChange={setOffered}
                variant="offer"
                error={fieldErrors.oferece}
              />

              <SkillEditor
                id="ep-looking"
                label="O que você procura"
                items={looking}
                onChange={setLooking}
                variant="looking"
                error={fieldErrors.procura}
              />
            </section>

            {/* ---------- Ações ---------- */}
            <div className="ep-actions">
              <button
                type="button"
                className="ep-cancel-button"
                onClick={() => navigate("/profile")}
              >
                Cancelar
              </button>

              <button type="submit" className="ep-save-button" disabled={saved || saving}>
                {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>

            <FormAlert kind="error">{formError}</FormAlert>

            {saved && (
              <p className="ep-success" role="status">
                <span className="material-symbols-outlined" aria-hidden="true">
                  check_circle
                </span>
                Perfil atualizado com sucesso! Redirecionando...
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
