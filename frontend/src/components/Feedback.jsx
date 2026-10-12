// Mensagens para o usuário: um aviso flutuante (success / error / info).
// Qualquer tela usa:  const { notify, unavailable } = useFeedback();
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [message, setMessage] = useState(null); // { id, kind, text }
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  const notify = useCallback((kind, text) => {
    clearTimeout(timerRef.current);
    setMessage({ id: Date.now(), kind, text });
    timerRef.current = setTimeout(() => setMessage(null), kind === "error" ? 9000 : 6000);
  }, []);

  // Para funcionalidades que ainda não existem nesta etapa: avisa com clareza que NADA foi feito.
  const unavailable = useCallback(
    (feature) => notify("info", `${feature} ainda não está disponível nesta versão. Nada foi salvo ou enviado.`),
    [notify],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const value = useMemo(() => ({ notify, unavailable, dismiss }), [notify, unavailable, dismiss]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="fb-region">
        {message && (
          <div
            key={message.id}
            className={`fb-toast fb-${message.kind}`}
            role={message.kind === "error" ? "alert" : "status"}
          >
            <span className="fb-toast-text">{message.text}</span>
            <button type="button" className="fb-toast-close" onClick={dismiss} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback deve ser usado dentro de <FeedbackProvider>.");
  return ctx;
}

// Faixa de mensagem dentro de formulários (erro, sucesso ou informação).
export function FormAlert({ kind = "error", children, id }) {
  if (!children) return null;
  return (
    <div id={id} className={`form-alert form-alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
