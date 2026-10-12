import { useState } from "react";

const asset = (name) => `/assets/${name}`;

export default function OnboardingStep02({ navigate }) {
  const [selected, setSelected] = useState([]);

  const toggle = (skill) => {
    setSelected((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill],
    );
  };

  return (
    <section className="onboarding02-section">
      <img
        className="onboarding02-brand"
        src={asset("5-3.png")}
        alt="TradeUp"
      />
      <div className="progress_onboarding">
        <div className="progress-info">
          <span>Etapa 02 de 02</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill step-2"></div>
        </div>
      </div>
      <div className="onboarding-content">
        <span className="onboarding-eyebrow">
          Agora vamos encontrar seu próximo passo
        </span>

        <h1 className="onboarding-title">O que você quer aprender?</h1>

        <p className="onboarding-subtitle">
          Escolha o que você procura e encontre pessoas com habilidades que
          podem completar a sua troca.
        </p>
      </div>
      <div className="onboarding-chips">
        {[
          "Programação",
          "Excel",
          "Edição de vídeo",
          "Design gráfico",
          "Inglês",
          "Fotografia",
        ].map((skill) => (
          <button
            key={skill}
            type="button"
            className={
              selected.includes(skill)
                ? "skill-button is-active"
                : "skill-button"
            }
            onClick={() => toggle(skill)}
          >
            {selected.includes(skill) && "✓ "}
            {skill}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="onboarding02-continue"
        onClick={() => navigate("/dashboard")}
      >
        Continuar
      </button>
      <button
        type="button"
        className="onboarding__skip"
        onClick={() => navigate("/onboarding/step01")}
      >
        Voltar
      </button>
    </section>
  );
}
