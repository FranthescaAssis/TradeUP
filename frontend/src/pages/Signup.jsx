import { useEffect, useState } from "react";
import { Eye, EyeOff } from "../components/Icons.jsx";
import { FormAlert, useFeedback } from "../components/Feedback.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  CAMPO_API,
  CAMPO_FORM,
  validarCadastro,
  validarCidade,
  validarConfirmacao,
  validarEmail,
  validarEstado,
  validarNome,
  validarSenhaNova,
} from "../auth/validation.js";

import { localidadesApi } from "../services/api.js";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const asset = (name) => `/assets/${name}`;

const EMPTY = { name: "", email: "", city: "", state: "", password: "", confirmation: "" };
const ORDER = ["name", "email", "city", "state", "password", "confirmation"];

export default function Signup({ navigate }) {
  const { register } = useAuth();
  const { notify } = useFeedback();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState({ password: false, confirmation: false });

  const [cidades, setCidades] = useState([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [erroCidades, setErroCidades] = useState("");
  const [tentativaCidades, setTentativaCidades] = useState(0);

  useEffect(() => {
    if (!values.state) return;
    let cancelado = false;
    setCarregandoCidades(true);
    setErroCidades("");
    setCidades([]);
    localidadesApi.cidades(values.state)
      .then((lista) => { if (!cancelado) setCidades(lista); })
      .catch(() => {
        if (!cancelado) setErroCidades("Não foi possível carregar as cidades.");
      })
      .finally(() => { if (!cancelado) setCarregandoCidades(false); });
    // Ignora respostas antigas se o usuário mudar o estado rapidamente.
    return () => { cancelado = true; };
  }, [values.state, tentativaCidades]);

  const toggle = (field) => setVisible((current) => ({ ...current, [field]: !current[field] }));

  // Valida um campo isolado (usado ao sair do campo e enquanto o usuário corrige um erro)
  function checkField(name, current) {
    switch (name) {
      case "name":
        return validarNome(current.name);
      case "email":
        return validarEmail(current.email);
      case "city":
        return validarCidade(current.city);
      case "state":
        return validarEstado(current.state);
      case "password":
        return validarSenhaNova(current.password);
      case "confirmation":
        return validarConfirmacao(current.password, current.confirmation);
      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name } = event.target;
    let { value } = event.target;
    if (name === "state") value = value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);

    const next = { ...values, [name]: value };
    if (name === "state") {
      next.city = "";
      setCidades([]);
      setErroCidades("");
      setCarregandoCidades(Boolean(value));
    }
    setValues(next);
    if (formError) setFormError("");

    // Só revalida na hora campos que já estavam com erro (não "grita" enquanto a pessoa ainda digita).
    setErrors((current) => {
      const updated = { ...current };
      if (name === "state") delete updated.city;
      if (current[name]) updated[name] = checkField(name, next);
      if (name === "password" && next.confirmation) updated.confirmation = checkField("confirmation", next);
      return updated;
    });
  }

  function handleBlur(event) {
    const { name } = event.target;
    if (!values[name]) return; // campo vazio só é cobrado ao enviar
    setErrors((current) => ({ ...current, [name]: checkField(name, values) }));
  }

  function focusField(name) {
    document.getElementById(`signup-${name}`)?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || carregandoCidades || erroCidades) return;

    const found = validarCadastro(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) {
      focusField(ORDER.find((field) => found[field]));
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        [CAMPO_API.name]: values.name,
        [CAMPO_API.email]: values.email,
        [CAMPO_API.city]: values.city,
        [CAMPO_API.state]: values.state,
        [CAMPO_API.password]: values.password,
        [CAMPO_API.confirmation]: values.confirmation,
      });
      // O redirecionamento para o painel é feito por App.jsx assim que a sessão passa a existir.
      notify("success", `Conta criada com sucesso! Bem-vindo(a) ao TradeUp, ${user.primeiroNome}.`);
    } catch (erro) {
      // Erros por campo vindos do back-end (ex.: e-mail já cadastrado) aparecem junto do campo.
      const fromServer = {};
      Object.entries(erro.fieldErrors ?? {}).forEach(([apiField, message]) => {
        const formField = CAMPO_FORM[apiField];
        if (formField) fromServer[formField] = message;
      });
      setErrors(fromServer);
      setFormError(erro.message);
      const first = ORDER.find((field) => fromServer[field]);
      if (first) focusField(first);
      setLoading(false);
    }
  }

  const fieldProps = (name) => ({
    id: `signup-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": errors[name] ? "true" : "false",
    "aria-describedby": errors[name] ? `signup-${name}-error` : name === "password" ? "signup-password-hint" : undefined,
  });

  const error = (name) =>
    errors[name] ? (
      <p className="field-error" id={`signup-${name}-error`}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <main className="signup-page">
      <section className="signup-card">
        <button
          type="button"
          className="signup-brand-link"
          onClick={() => navigate("/")}
          aria-label="Voltar para o início TradeUp+"
        >
          <img className="signup-brand" src={asset("5-3.png")} alt="TradeUp+" />
        </button>

        <p className="signup-welcome">FAÇA PARTE DA COMUNIDADE</p>

        <header className="signup-title-block">
          <h1 id="signup-title">Crie sua conta</h1>
          <p>Comece sua jornada agora</p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate aria-labelledby="signup-title">
          <FormAlert kind="error" id="signup-form-error">
            {formError}
          </FormAlert>

          <div className="signup-field">
            <label htmlFor="signup-name">Nome completo</label>
            <input {...fieldProps("name")} type="text" autoComplete="name" placeholder="Seu nome completo" maxLength={100} />
            {error("name")}
          </div>

          <div className="signup-field">
            <label htmlFor="signup-email">E-mail</label>
            <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="você@email.com" maxLength={100} />
            {error("email")}
          </div>

          <div className="signup-location-fields">
            <div className="signup-field signup-uf-field">
              <label htmlFor="signup-state">Estado (UF)</label>
              <select {...fieldProps("state")} autoComplete="address-level1">
                <option value="">Selecione</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              {error("state")}
            </div>
            <div className="signup-field">
              <label htmlFor="signup-city">Cidade</label>
              <select {...fieldProps("city")} autoComplete="address-level2"
                disabled={!values.state || carregandoCidades || Boolean(erroCidades)}>
                <option value="">{!values.state ? "Escolha o estado primeiro" : carregandoCidades ? "Carregando..." : "Selecione a cidade"}</option>
                {cidades.map((cidade) => <option key={cidade} value={cidade}>{cidade}</option>)}
              </select>
              {error("city")}
              {erroCidades && <div role="alert">
                <p className="field-error">{erroCidades}</p>
                <button type="button" onClick={() => setTentativaCidades((n) => n + 1)}>Tentar novamente</button>
              </div>}
            </div>
          </div>

          <PasswordField
            {...fieldProps("password")}
            label="Senha"
            placeholder="Crie uma senha forte"
            visible={visible.password}
            onToggle={() => toggle("password")}
            error={error("password")}
            hint={!errors.password && <p className="field-hint" id="signup-password-hint">Mínimo de 8 caracteres, com letras e números.</p>}
          />

          <PasswordField
            {...fieldProps("confirmation")}
            label="Confirmar senha"
            placeholder="Repita a senha criada"
            visible={visible.confirmation}
            onToggle={() => toggle("confirmation")}
            error={error("confirmation")}
          />

          <button
            className={`signup-submit ${loading ? "is-loading" : ""}`}
            type="submit"
            disabled={loading || carregandoCidades || Boolean(erroCidades)}
            aria-busy={loading}
          >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {loading ? "Criando conta..." : "Cadastrar"}
          </button>
        </form>

        <p className="signup-login">
          <span>Já tem conta? </span>

          <button type="button" onClick={() => navigate("/login")}>
            Entrar
          </button>
        </p>
      </section>
    </main>
  );
}

function PasswordField({ id, name, label, placeholder, visible, onToggle, error, hint, ...inputProps }) {
  return (
    <div className="signup-field">
      <label htmlFor={id}>{label}</label>

      <div className="signup-password-wrap">
        <input
          {...inputProps}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          maxLength={72}
        />

        <button
          className="password-toggle"
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error}
      {hint}
    </div>
  );
}
