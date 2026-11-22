import { OnboardingHeader, SkillChips, clearOnboardingDraft, useOnboardingSkills } from "./onboardingSkills.jsx";

const SKILLS = ["Inglês", "Organização financeira", "Design Gráfico", "Fotografia", "Culinária", "Programação"];

export default function OnboardingStep02({ navigate }) {
  const { all, selected, toggle, save, saving, error } = useOnboardingSkills("procura", SKILLS);

  const handleContinue = async () => {
    if (await save()) {
      clearOnboardingDraft();
      navigate("/dashboard");
    }
  };

  return (
    <section className="onboarding-section">
      <OnboardingHeader step={2} />

      <div className="onboarding-body">
        <div className="onboarding-content">
          <span className="onboarding-eyebrow">Agora vamos encontrar seu próximo passo</span>
          <h1 className="onboarding-title">
            O que você <em>quer aprender?</em>
          </h1>
          <p className="onboarding-subtitle">
            Isso ajuda a criar matches mútuos — trocas em que os dois lados ganham.
          </p>
        </div>

        <SkillChips all={all} selected={selected} toggle={toggle} label="Habilidades que você quer aprender" />

        {error && (
          <p className="onboarding-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="onboarding-continue" onClick={handleContinue} disabled={saving}>
          {saving ? "Salvando..." : "Continuar"}
        </button>

        <button
          type="button"
          className="onboarding__skip"
          onClick={() => navigate("/onboarding/step01")}
          disabled={saving}
        >
          Voltar
        </button>
      </div>
    </section>
  );
}
