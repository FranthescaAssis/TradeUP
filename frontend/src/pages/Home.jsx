import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  ArrowRight,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "../components/Icons.jsx";

const asset = (name) => `/assets/${name}`;

const NAV_SECTIONS = [
  { id: "top", label: "Início" },
  { id: "beneficios", label: "Benefícios" },
  { id: "servicos", label: "Serviços" },
  { id: "processo", label: "Como funciona" },
  { id: "cta-final", label: "Comece agora" },
];

const pad = (n) => String(n).padStart(2, "0");

export default function Home({ navigate }) {
  const { isAuthenticated } = useAuth();
  // Quem já está conectado vai direto ao painel; visitantes vão ao cadastro.
  const startPath = isAuthenticated ? "/dashboard" : "/cadastro";
  const [activeIndex, setActiveIndex] = useState(0);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setNavVisible(window.scrollY > 240);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = NAV_SECTIONS.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.5 },
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
  }, []);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    return () => reveal.disconnect();
  }, []);

  function goToSection(index) {
    const clamped = Math.max(0, Math.min(NAV_SECTIONS.length - 1, index));
    const el = document.getElementById(NAV_SECTIONS[clamped].id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <header className="site-header" data-layer="Header" data-node-id="5-1">
        <button
          className="brand-link"
          onClick={() => navigate("/")}
          aria-label="TradeUp+ início"
        >
          <img
            className="brand-logo"
            src={asset("TradeUpLogo_Branca.png")}
            alt="TradeUp+"
          />
        </button>

        <nav className="header-actions" aria-label="Navegação principal">
          {!isAuthenticated && (
            <button className="sign-in-link" onClick={() => navigate("/login")}>
              Entrar
            </button>
          )}
          <button
            className="primary-button header-button"
            onClick={() => navigate(startPath)}
          >
            <span>{isAuthenticated ? "Ir para o painel" : "Criar minha conta"}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </nav>
      </header>

      <main className="site-shell">
        <section className="hero-section" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow-row">
              <Sparkles aria-hidden="true" />
              <p>UMA COMUNIDADE DE TROCAS REAIS</p>
            </div>
            <h1 id="hero-title">
              <span>O que você sabe</span>
              <span className="accent-line">pode mudar o dia</span>
              <span>de alguém.</span>
            </h1>
            <p className="hero-description">
              Troque habilidades, conhecimentos e serviços com pessoas que
              também têm algo para compartilhar. Sem complicação, com propósito.
            </p>
            <button
              className="primary-button hero-button"
              onClick={() => navigate(startPath)}
            >
              <span>{isAuthenticated ? "Ir para o painel" : "Começar"}</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="hero-art-wrap">
            <img
              className="hero-art"
              src={asset("5-15.webp")}
              alt="Três pessoas compartilhando habilidades, ideias e uma planta"
            />
          </div>
        </section>

        <section
          className="benefits-section reveal"
          id="beneficios"
          aria-labelledby="benefits-title"
        >
          <div className="benefits-layout">
            <div className="benefits-intro">
              <p className="section-kicker">
                FEITO PARA QUEM GOSTA DE APRENDER
              </p>
              <h2 id="benefits-title">
                <span>Ofereça o que sabe.</span>
                <span className="accent-line">Encontre o que procura.</span>
              </h2>
            </div>
            <div className="benefits-list">
              <article className="benefit-card">
                <div className="benefit-icon icon-purple">
                  <RefreshCw aria-hidden="true" />
                </div>
                <h3>Trocas com propósito</h3>
                <p>Habilidades viram novas possibilidades.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon icon-mint">
                  <Sparkles aria-hidden="true" />
                </div>
                <h3>Aprendizado contínuo</h3>
                <p>
                  Aprenda novas habilidades, enquanto compartilha o que sabe.
                </p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon icon-yellow">
                  <MessageCircle aria-hidden="true" />
                </div>
                <h3>Conexões reais</h3>
                <p>Converse, combine os detalhes e acompanhe sua troca.</p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="service-section reveal"
          id="servicos"
          aria-labelledby="services-heading"
        >
          <div className="services-title">
            <div>
              <p className="section-kicker">EXPLORE</p>
              <h2 id="services-heading">Serviços disponíveis</h2>
            </div>

            <button type="button" className="services-see-more">
              Ver todos
              <span>→</span>
            </button>
          </div>

          <div className="grid-service">
            <article className="service-card">
              <div className="service-icon">
                <span className="material-symbols-outlined">
                  video_camera_front
                </span>
              </div>

              <span className="service-category">Artes</span>

              <h3>Edição de vídeo</h3>

              <p>Edição de vídeos para redes sociais e projetos pessoais.</p>

              <div className="service-user">
                <div className="service-avatar">A</div>

                <span>Ana</span>
              </div>

              <button type="button" className="service-button">
                Ver serviço
                <span>→</span>
              </button>
            </article>

            <article className="service-card">
              <div className="service-icon">
                <span className="material-symbols-outlined">language</span>
              </div>

              <span className="service-category">Idiomas</span>

              <h3>Conversação em inglês</h3>

              <p>Prática de conversação para quem quer desenvolver o inglês.</p>

              <div className="service-user">
                <div className="service-avatar service-avatar-pink">J</div>

                <span>João</span>
              </div>

              <button type="button" className="service-button">
                Ver serviço
                <span>→</span>
              </button>
            </article>

            <article className="service-card">
              <div className="service-icon">
                <span className="material-symbols-outlined">palette</span>
              </div>

              <span className="service-category">Design</span>

              <h3>Design gráfico</h3>

              <p>
                Criação de artes para redes sociais, apresentações e projetos.
              </p>

              <div className="service-user">
                <div className="service-avatar service-avatar-yellow">M</div>

                <span>Marina</span>
              </div>

              <button type="button" className="service-button">
                Ver serviço
                <span>→</span>
              </button>
            </article>
          </div>
        </section>

        <section
          className="process-section reveal"
          id="processo"
          aria-labelledby="process-title"
        >
          <div className="process-intro">
            <p className="section-kicker">COMO FUNCIONA</p>
            <h2 id="process-title">
              <span>Uma troca começa</span>
              <span className="accent-line">com uma conversa.</span>
            </h2>
          </div>
          <div className="process-steps">
            <article className="process-step">
              <span className="step-number">01.</span>
              <h3>Crie uma conta</h3>
              <p>Conte para a comunidade o que você sabe fazer.</p>
            </article>
            <article className="process-step">
              <span className="step-number">02.</span>
              <h3>Encontre sua troca</h3>
              <p>Explore oportunidades que combinam com você.</p>
            </article>
            <article className="process-step">
              <span className="step-number">03.</span>
              <h3>Conecte-se</h3>
              <p>Combine detalhes e faça a troca acontecer.</p>
            </article>
          </div>
        </section>

        <section
          className="final-cta-section reveal"
          id="cta-final"
          aria-labelledby="final-cta-title"
        >
          <p className="section-kicker">COMECE HOJE</p>
          <h2 id="final-cta-title">Sua primeira troca pode começar agora.</h2>
          <p>
            Crie sua conta, conte o que você sabe fazer e encontre alguém pronto
            para trocar com você.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate(startPath)}
          >
            <span>{isAuthenticated ? "Ir para o painel" : "Criar minha conta"}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </section>
      </main>

      <nav
        className={`section-nav ${navVisible ? "is-visible" : ""}`}
        aria-label="Navegação por seções da página"
      >
        <button
          type="button"
          className="section-nav-arrow"
          onClick={() => goToSection(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Seção anterior"
        >
          <ArrowRight className="icon-up" aria-hidden="true" />
        </button>

        <div className="section-nav-status">
          <span className="section-nav-count">
            {pad(activeIndex + 1)} / {pad(NAV_SECTIONS.length)}
          </span>
          <div className="section-nav-dots">
            {NAV_SECTIONS.map((section, i) => (
              <button
                type="button"
                key={section.id}
                className={`section-nav-dot ${i === activeIndex ? "is-active" : ""}`}
                onClick={() => goToSection(i)}
                aria-label={`Ir para ${section.label}`}
                aria-current={i === activeIndex}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="section-nav-arrow"
          onClick={() => goToSection(activeIndex + 1)}
          disabled={activeIndex === NAV_SECTIONS.length - 1}
          aria-label="Próxima seção"
        >
          <ArrowRight className="icon-down" aria-hidden="true" />
        </button>
      </nav>
    </>
  );
}
