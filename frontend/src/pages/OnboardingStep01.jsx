import { useState, useRef } from "react";

const asset = (name) => `/assets/${name}`;

const BIO_MAX_LENGTH = 300;

export default function OnboardingStep01({ navigate }) {
  const [selected, setSelected] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [bio, setBio] = useState("");

  const fileInputRef = useRef(null);

  const toggle = (skill) => {
    setSelected((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill],
    );
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setPhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <section className="onboarding01-section">
      <img className="onboarding-brand" src={asset("5-3.png")} alt="TradeUp" />

      <div className="progress_onboarding">
        <div className="progress-info">
          <span>Etapa 01 de 02</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill step-1"></div>
        </div>
      </div>

      <div className="onboarding-content">
        <span className="onboarding-eyebrow">Vamos começar por você</span>

        <h1 className="onboarding-title">O que você pode compartilhar?</h1>

        <p className="onboarding-subtitle">
          Escolha algumas habilidades para encontrarmos trocas que combinam com
          você.
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

      <div className="onboarding-photo">
        <h2 className="photo-title">
          Coloque um rosto e uma história no seu perfil
        </h2>

        <p className="photo-subtitle">
          Isso é opcional, mas perfis com foto e apresentação se tornam mais
          confiáveis.
        </p>

        {photo && (
          <img
            src={photo}
            alt="Foto de perfil"
            className="onboarding-photo-preview"
          />
        )}

        <div className="onboarding__photo-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="visually-hidden"
            id="onboarding-photo-input"
          />

          <label htmlFor="onboarding-photo-input" className="photo-button">
            {photo ? "Trocar foto" : "Adicionar foto"}
          </label>

          {photo && (
            <button
              type="button"
              className="onboarding__photo-remove"
              onClick={handleRemovePhoto}
            >
              Remover
            </button>
          )}

          <p className="onboarding__photo-hint">
            JPG, PNG ou GIF. Tamanho máximo 5MB.
          </p>
        </div>
      </div>

      <div className="onboarding-bio-field">
        <label className="label-onboarding" htmlFor="onboarding-bio">
          Fale um pouco sobre você
        </label>

        <textarea
          id="onboarding-bio"
          className="onboarding-textarea"
          placeholder="Ex.: Gosto de transformar ideias complexas em coisas simples e bonitas..."
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          onChange={(e) => setBio(e.target.value)}
        />

        <span className="onboarding__bio-count">
          {bio.length}/{BIO_MAX_LENGTH} caracteres
        </span>
      </div>

      <button
        type="button"
        className="onboarding-continue"
        onClick={() => navigate("/onboarding/step02")}
      >
        Continuar
      </button>

      <button type="button" className="onboarding__skip" onClick={handleSkip}>
        Pular por agora
      </button>
    </section>
  );
}
