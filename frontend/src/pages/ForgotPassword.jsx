import { FormAlert, useFeedback } from "../components/Feedback.jsx";

const asset = (name) => `/assets/${name}`;
export default function ForgotPassword({ navigate }) {
  const { unavailable } = useFeedback();

  function handleSubmit(event) {
    event.preventDefault();
    // Recuperação de senha por e-mail ainda não existe: não enviamos nada e dizemos isso com clareza.
    unavailable("A recuperação de senha");
  }

  return (
    <main className="forgotpassword-page">
      <section className="forgot-card">
        <button
          className="forgot-brand-link"
          onClick={() => navigate("/")}
          aria-label="Voltar para o início TradeUp+"
        >
          <img className="forgot-brand" src={asset("5-3.png")} alt="TradeUp+" />
        </button>
        <h2 className="forgot-title">Recupere a sua senha</h2>
        <p className="forgot-subtitle">
          Enviaremos um link para o seu e-mail para redefinir sua senha.
        </p>

        <div className="forgot-notice">
          <FormAlert kind="info">
            Atenção: a recuperação de senha ainda está em desenvolvimento. Nenhum e-mail será enviado por enquanto.
          </FormAlert>
        </div>

        <form className="forgot-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="forgot-email">E-mail</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            placeholder="você@email.com"
          />

          <button className="forgot-submit" type="submit">
            Enviar
          </button>
        </form>

        <button className="forgot-link" type="button" onClick={() => navigate("/login")}>
          Voltar para o login
        </button>
      </section>
    </main>
  );
}
