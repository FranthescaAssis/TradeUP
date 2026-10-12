import { useState } from "react";

import { Eye, EyeOff } from "../components/Icons.jsx";
import { FormAlert, useFeedback } from "../components/Feedback.jsx";

const asset = (name) => `/assets/${name}`;

export default function ResetPassword({ navigate }) {
  const { unavailable } = useFeedback();
  const [visible, setVisible] = useState({
    password: false,
    confirmation: false,
  });

  function toggle(field) {
    setVisible((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Redefinição de senha ainda não existe: nada é alterado e avisamos com clareza.
    unavailable("A redefinição de senha");
  }

  return (
    <main className="reset-page">
      <section className="reset-card">
        <button
          className="reset-brand-link"
          onClick={() => navigate("/")}
          type="button"
          aria-label="Voltar para o início TradeUp+"
        >
          <img className="reset-brand" src={asset("5-3.png")} alt="TradeUp+" />
        </button>

        <h2 className="reset-title">Nova Senha</h2>

        <p className="reset-subtitle">
          Crie uma nova senha forte para proteger sua conta.
        </p>

        <FormAlert kind="info">
          Atenção: a redefinição de senha ainda está em desenvolvimento. Nenhuma senha será alterada por enquanto.
        </FormAlert>

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-field">
            <label htmlFor="new-password">Nova senha</label>

            <div className="password-wrapper">
              <input
                id="new-password"
                name="password"
                type={visible.password ? "text" : "password"}
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => toggle("password")}
                aria-label={
                  visible.password ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {visible.password ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="reset-field">
            <label htmlFor="confirm-password">Confirmar senha</label>

            <div className="password-wrapper">
              <input
                id="confirm-password"
                name="confirmation"
                type={visible.confirmation ? "text" : "password"}
                placeholder="Confirme sua nova senha"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => toggle("confirmation")}
                aria-label={
                  visible.confirmation
                    ? "Ocultar confirmação"
                    : "Mostrar confirmação"
                }
              >
                {visible.confirmation ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button className="reset-submit" type="submit">
            Redefinir senha
          </button>
        </form>
      </section>
    </main>
  );
}
