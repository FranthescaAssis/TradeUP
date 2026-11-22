import { OnboardingHeader, SkillChips, clearOnboardingDraft, useOnboardingSkills } from "./onboardingSkills.jsx";

const SKILLS = ["Edição de Vídeo", "Excel", "Design Gráfico", "Fotografia", "Culinária", "Programação"];

export default function OnboardingStep01({ navigate }) {
  const { all, selected, toggle, save, saving, error } = useOnboardingSkills("oferece", SKILLS);

  const handleContinue = async () => {
    if (await save()) navigate("/onboarding/step02");
  };

  const handleSkip = () => {
    clearOnboardingDraft();
    navigate("/dashboard");
  };

  return (
    <section className="onboarding-section">
      <OnboardingHeader step={1} />

      <div className="onboarding-body">
        <div className="onboarding-content">
          <span className="onboarding-eyebrow">Vamos começar pelo que você sabe</span>
          <h1 className="onboarding-title">
            O que você pode <em>compartilhar?</em>
          </h1>
          <p className="onboarding-subtitle">
            Escolha algumas habilidades para encontrarmos trocas que combinam com você.
          </p>
        </div>

        <SkillChips all={all} selected={selected} toggle={toggle} label="Habilidades que você pode compartilhar" />

        {error && (
          <p className="onboarding-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="onboarding-continue" onClick={handleContinue} disabled={saving}>
          {saving ? "Salvando..." : "Continuar"}
        </button>

        <button type="button" className="onboarding__skip" onClick={handleSkip} disabled={saving}>
          Pular por agora
        </button>
      </div>
    </section>
  );
}
