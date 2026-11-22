// Partes compartilhadas pelas duas etapas do onboarding (habilidades e interesses).
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";

const DRAFT_KEY = "tradeup.onboarding";

// Rascunho na sessão do navegador: mantém as seleções ao avançar e voltar entre as etapas.
function readDraft() {
  try {
    return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeDraft(tipo, lista) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readDraft(), [tipo]: lista }));
  } catch {
    /* sem armazenamento: as seleções valem só enquanto a tela estiver aberta */
  }
}

export function clearOnboardingDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nada a fazer */
  }
}

// tipo: "oferece" (etapa 1) ou "procura" (etapa 2), como na API de perfil.
export function useOnboardingSkills(tipo, options) {
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState(() => readDraft()[tipo] ?? user?.[tipo] ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Habilidades já salvas que não estão na lista padrão também aparecem para não serem perdidas.
  const lower = options.map((o) => o.toLowerCase());
  const extras = (user?.[tipo] ?? []).filter((s) => !lower.includes(s.toLowerCase()));
  const all = [...options, ...extras];

  const toggle = (skill) => {
    setError("");
    setSelected((prev) => {
      const next = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      writeDraft(tipo, next);
      return next;
    });
  };

  // Salva a lista pelo PATCH /auth/me; os demais campos do perfil são reenviados como estão.
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const atualizado = await authApi.atualizarPerfil({
        nome: user.nome,
        cidade: user.cidade,
        estado: user.estado,
        descricao: user.descricao ?? null,
        [tipo]: selected,
      });
      updateUser(atualizado);
      return true;
    } catch (erro) {
      setError(erro.fieldErrors?.[tipo] ?? erro.message ?? "Não foi possível salvar. Tente novamente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { all, selected, toggle, save, saving, error };
}

export function OnboardingHeader({ step }) {
  return (
    <>
      <img className="onboarding-brand" src="/assets/5-3.png" alt="TradeUp" />
      <div className="onboarding-progress">
        <span className="onboarding-progress__label">Etapa {step} de 2</span>
        <div
          className="onboarding-progress__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={step}
          aria-label={`Etapa ${step} de 2`}
        >
          <div className="onboarding-progress__fill" style={{ width: `${(step / 2) * 100}%` }} />
        </div>
      </div>
    </>
  );
}

export function SkillChips({ all, selected, toggle, label }) {
  return (
    <div className="onboarding-chips" role="group" aria-label={label}>
      {all.map((skill) => {
        const active = selected.includes(skill);
        return (
          <button
            key={skill}
            type="button"
            className={active ? "skill-button is-active" : "skill-button"}
            aria-pressed={active}
            onClick={() => toggle(skill)}
          >
            {active && (
              <svg className="skill-button__check" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {skill}
          </button>
        );
      })}
    </div>
  );
}
