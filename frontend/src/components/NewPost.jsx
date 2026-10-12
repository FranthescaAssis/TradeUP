import { useEffect, useState } from "react";
import { FormAlert } from "./Feedback.jsx";

const CATEGORIES = [
  "Tecnologia",
  "Idiomas",
  "Artes",
  "Design",
  "Marketing",
  "Bem-estar",
];

const MODALITIES = [
  ["online", "Online"],
  ["presencial", "Presencial"],
  ["ambos", "Online ou presencial"],
];

const emptyForm = { title: "", category: "", modality: "", description: "", counterpart: "" };

// Nomes dos campos da API -> campos do formulário (para mostrar cada erro no lugar certo).
const FIELD_NAMES = {
  titulo: "title",
  categoria: "category",
  modalidade: "modality",
  descricao: "description",
  contrapartida: "counterpart",
};

export default function NewPostModal({ open, onClose, onSubmit }) {
  const [mode, setMode] = useState("offer"); // "offer" | "ask"
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const isOffer = mode === "offer";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError("");
    setFieldErrors({});
    try {
      // onSubmit (App.jsx) envia à API; se der erro ele é lançado e mostrado aqui, sem apagar o texto.
      await onSubmit?.({
        titulo: form.title,
        descricao: form.description,
        categoria: form.category,
        tipo: isOffer ? "oferta" : "necessidade",
        modalidade: form.modality,
        // Só a solicitação tem contrapartida do autor; na oferta o próprio anúncio é a contrapartida.
        ...(isOffer ? {} : { contrapartida: form.counterpart }),
      });
      setForm(emptyForm);
    } catch (erro) {
      setError(erro.message);
      const campos = {};
      Object.entries(erro.fieldErrors ?? {}).forEach(([campo, msg]) => {
        campos[FIELD_NAMES[campo] ?? campo] = msg;
      });
      setFieldErrors(campos);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="newpost-overlay" onClick={onClose}>
      <aside
        className="newpost-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newpost-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="newpost-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <p className="newpost-eyebrow">NOVA PUBLICAÇÃO</p>

        <h2 id="newpost-title" className="newpost-title">
          {isOffer ? "Oferecendo uma habilidade" : "Solicitando um serviço"}
        </h2>

        <div className="newpost-tabs">
          <button
            type="button"
            className={isOffer ? "active" : ""}
            onClick={() => setMode("offer")}
          >
            Quero oferecer
          </button>
          <button
            type="button"
            className={!isOffer ? "active" : ""}
            onClick={() => setMode("ask")}
          >
            Quero pedir
          </button>
        </div>

        <form className="newpost-form" onSubmit={handleSubmit}>
          <label htmlFor="np-title">Título da troca</label>
          <input
            id="np-title"
            value={form.title}
            onChange={update("title")}
            placeholder="Ex: Aulas de edição para redes sociais"
            required
          />
          {fieldErrors.title && (
            <p className="field-error">{fieldErrors.title}</p>
          )}

          <label htmlFor="np-category">Categoria</label>
          <select
            id="np-category"
            value={form.category}
            onChange={update("category")}
            required
          >
            <option value="" disabled>
              Escolha uma categoria
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="field-error">{fieldErrors.category}</p>
          )}

          <label htmlFor="np-modality">Modalidade</label>
          <select
            id="np-modality"
            value={form.modality}
            onChange={update("modality")}
            required
          >
            <option value="" disabled>
              Como será a troca?
            </option>
            {MODALITIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldErrors.modality && (
            <p className="field-error">{fieldErrors.modality}</p>
          )}

          <label htmlFor="np-description">Descrição</label>
          <textarea
            id="np-description"
            value={form.description}
            onChange={update("description")}
            placeholder="O que você sabe fazer ou precisa receber em troca?"
            rows={5}
            required
          />
          {fieldErrors.description && (
            <p className="field-error">{fieldErrors.description}</p>
          )}

          {!isOffer && (
            <>
              <label htmlFor="np-counterpart">O que você oferece em troca?</label>
              <textarea
                id="np-counterpart"
                value={form.counterpart}
                onChange={update("counterpart")}
                placeholder="Ex: Aulas de violão para iniciantes"
                rows={3}
                maxLength={500}
                required
              />
              {fieldErrors.counterpart && (
                <p className="field-error">{fieldErrors.counterpart}</p>
              )}
            </>
          )}

          <FormAlert>{error}</FormAlert>

          <button type="submit" className="newpost-submit" disabled={sending}>
            {sending ? "Publicando..." : "Publicar →"}
          </button>
        </form>
      </aside>
    </div>
  );
}
