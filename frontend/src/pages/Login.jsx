import { useState } from "react";
import { Eye, EyeOff } from "../components/Icons.jsx";
import { FormAlert, useFeedback } from "../components/Feedback.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { validarEmail, validarLogin } from "../auth/validation.js";

const asset = (name) => `/assets/${name}`;

export default function Login({ navigate }) {
  const { login } = useAuth();
  const { notify } = useFeedback();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
    if (formError) setFormError("");
  }

  function handleEmailBlur() {
    if (!values.email) return;
    const message = validarEmail(values.email, { checarTamanho: false });
    setErrors((current) => ({ ...current, email: message }));
  }

  function focusField(name) {
    document.getElementById(`login-${name}`)?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    const found = validarLogin(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) {
      focusField(Object.keys(found)[0]);
      return;
    }

    setLoading(true);
    try {
      const user = await login(values);
      // O redirecionamento para o painel é feito por App.jsx assim que a sessão passa a existir.
      notify("success", `Bem-vindo(a) de volta, ${user.primeiroNome}!`);
    } catch (erro) {
      setFormError(erro.message);
      if (erro.status === 401) {
        setValues((current) => ({ ...current, password: "" }));
        focusField("password");
      }
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <button
          type="button"
          className="login-brand-link"
          onClick={() => navigate("/")}
          aria-label="Voltar para o início TradeUp+"
        >
          <img className="login-brand" src={asset("5-3.png")} alt="TradeUp+" />
        </button>

        <p className="login-welcome">QUE BOM TE VER AQUI</p>

        <header className="login-title-block">
          <h1 id="login-title">Entre na sua conta</h1>
          <p>Continue de onde você parou</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
          <FormAlert kind="error" id="login-form-error">
            {formError}
          </FormAlert>

          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="você@email.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && (
              <p className="field-error" id="login-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Senha</label>

            <div className="password-input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha segura"
                value={values.password}
                onChange={handleChange}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "login-password-error" : undefined}
              />

              <button
                className="password-lock"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && (
              <p className="field-error" id="login-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <p className="forgot-password">
            <button className="forgot-link" type="button" onClick={() => navigate("/forgotpassword")}>
              Esqueci minha senha
            </button>
          </p>

          <button
            className={`login-submit ${loading ? "is-loading" : ""}`}
            type="submit"
            aria-busy={loading}
          >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-signup">
          <span>Não tem conta? </span>

          <button className="signup-link" type="button" onClick={() => navigate("/cadastro")}>
            Cadastre-se
          </button>
        </p>
      </section>
    </main>
  );
}
