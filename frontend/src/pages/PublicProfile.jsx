import { useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
const asset = (name) => `/assets/${name}`;

const profiles = {
  marina: {
    name: "Marina Costa",
    initial: "M",
    avatar: "#e0507a",
    city: "Goiânia, GO",
    member: "MARÇO DE 2026",
    rating: "5,0",
    reviewCount: "2 avaliações",
    completed: "100%",
    response: "< 1h",
    offered: ["Edição de vídeo", "Storytelling"],
    looking: ["Inglês", "Fotografia"],
    trade: "Propor troca",
    about:
      "Criativa e curiosa, adoro transformar ideias em vídeos e histórias. Estou sempre aberta a trocar conhecimento e aprender algo novo com a comunidade TradeUp.",
    reviews: [
      {
        name: "Gustavo Lima",
        time: "há 1 semana",
        initials: "GL",
        text: "Edição ficou incrível, super profissional!",
        tags: ["Pontual", "Ótima qualidade"],
        stars: 5,
      },
      {
        name: "Beatriz Souza",
        time: "há 2 semanas",
        initials: "BS",
        text: "Muito atenciosa e entregou antes do combinado.",
        tags: ["Atenciosa", "Recomendo"],
        stars: 5,
      },
    ],
  },

  rafael: {
    name: "Rafael Mendes",
    initial: "R",
    avatar: "#8b613d",
    city: "Rio de Janeiro, RJ",
    member: "MAIO DE 2026",
    rating: "3,5",
    reviewCount: "15 avaliações",
    completed: "85%",
    response: "< 1h",
    offered: ["Programação", "Lógica"],
    looking: ["Storytelling", "Vôlei"],
    trade: "Propor troca",
    about:
      "Engenheiro de Software formado, apaixonado por tecnologia e sempre em busca de compartilhar o que sei, aprender com outras pessoas e transformar conhecimento em novas possibilidades.",
    reviews: [
      {
        name: "Geovana Maria",
        time: "há 2 semanas",
        initials: "GM",
        text: "Bom professor!",
        tags: ["Pontual", "Didática"],
        stars: 4,
      },
      {
        name: "João Marcelo",
        time: "há 1 semana",
        initials: "JM",
        text: "Se souber comunicar muito bem, deixa tudo mais fácil.",
        tags: ["Comunicativo", "Recomendo"],
        stars: 5,
      },
    ],
  },

  ana: {
    name: "Ana Lima",
    initial: "A",
    avatar: "#b98768",
    city: "Belo Horizonte, MG",
    member: "ABRIL DE 2026",
    rating: "4,9",
    reviewCount: "7 avaliações",
    completed: "100%",
    response: "< 2h",
    offered: ["Design Gráfico", "Finanças"],
    looking: ["Organização", "Storytelling"],
    trade: "Propor troca",
    about:
      "Especialista em organização e planejamento financeiro. Gosto de transformar informações complexas em rotinas simples e práticas para o dia a dia.",
    reviews: [
      {
        name: "Marina Costa",
        time: "há 3 dias",
        initials: "MC",
        text: "Muito atenciosa e didática!",
        tags: ["Clareza", "Pontual"],
        stars: 5,
      },
    ],
  },

  beatriz: {
    name: "Beatriz Souza",
    initial: "B",
    avatar: "#dfaa8c",
    city: "Anápolis, GO",
    member: "JUNHO DE 2026",
    rating: "4,8",
    reviewCount: "12 avaliações",
    completed: "95%",
    response: "< 2h",
    offered: ["Inglês", "Conversação"],
    looking: ["Fotografia", "Design Gráfico"],
    trade: "Propor troca",
    about:
      "Professora de inglês apaixonada por idiomas e pelo aprendizado. Gosto de ajudar pessoas a desenvolverem sua comunicação, praticar conversação e ganhar confiança para usar o inglês no dia a dia. Acredito que aprender pode ser leve, prático e colaborativo.",
    reviews: [
      {
        name: "Marina Costa",
        time: "há 1 semana",
        initials: "MC",
        text: "Muito paciente e explica tudo de um jeito fácil de entender!",
        tags: ["Didática", "Paciência"],
        stars: 5,
      },
      {
        name: "Lucas Almeida",
        time: "há 3 dias",
        initials: "LA",
        text: "As aulas de conversação me ajudaram bastante a praticar inglês.",
        tags: ["Comunicativa", "Recomendo"],
        stars: 5,
      },
    ],
  },
};

const navItems = [
  { label: "Início", path: "/dashboard", icone: "home" },
  { label: "Explorar", path: "/explore", icone: "search" },
  { label: "Minhas trocas", path: "/mytrades", icone: "swap_horiz" },
  { label: "Mensagens", path: "/chat", icone: "message" },
  { label: "Configurações", path: "/settings", icone: "settings" },
];

function Stars({ amount = 5 }) {
  return (
    <span className="public-stars" aria-label={`${amount} de 5 estrelas`}>
      {"★".repeat(amount)}
      <span>{"★".repeat(5 - amount)}</span>
    </span>
  );
}

export default function PublicProfile({
  navigate,
  profileId,
  isOwner = false,
}) {
  const { user, logout } = useAuth();
  const params = new URLSearchParams(window.location.search);

  const selectedProfile = isOwner
    ? "marina"
    : profileId || params.get("user") || "rafael";

  const baseProfile = profiles[selectedProfile] || profiles.rafael;
  // No próprio perfil, identidade, cidade e descrição vêm da conta real. Nota, avaliações e habilidades ainda não
  // existem no sistema, então ficam vazias (nada de dados de exemplo apresentados como se fossem do usuário).
  // As habilidades já são reais: vêm da conta.
  const profile = isOwner
    ? {
        ...baseProfile,
        name: user.nome,
        initial: user.inicial,
        city: user.cidade && user.estado ? `${user.cidade}, ${user.estado}` : baseProfile.city,
        rating: "—",
        reviewCount: "Sem avaliações ainda",
        offered: user.oferece ?? [],
        looking: user.procura ?? [],
        reviews: [],
        about: user.descricao || "Você ainda não escreveu uma descrição. Use \"Editar perfil\" para contar um pouco sobre você.",
        member: new Date(user.data_cadastro).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase(),
      }
    : baseProfile;

  const [activeNav, setActiveNav] = useState(isOwner ? "" : "/explore");

  const goTo = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  const sendProposal = () => {
    navigate(`/proposalprofile?user=${selectedProfile}`);
  };

  const goBack = () => {
    navigate(isOwner ? "/dashboard" : "/explore");
  };

  return (
    <div className="public-profile-page">
      <aside className="dashboard-sidebar">
        <button
          className="dashboard-brand-link"
          onClick={() => navigate("/")}
          aria-label="Ir para o início"
        >
          <img
            className="dashboard-brand"
            src={asset("5-3.png")}
            alt="TradeUp+"
          />
        </button>

        <p className="sidebar-intro">
          Troque o que você sabe, <br />
          <strong>descubra o que vem depois</strong>
        </p>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${
                activeNav === item.path ? "active" : ""
              }`}
              onClick={() => goTo(item.path)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {item.icone}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar marina-avatar">{user.inicial}</div>
          <strong>{user.nome}</strong>
        </div>

        <button className="logout-button" onClick={logout}>
          Sair da Conta
        </button>
      </aside>

      <main className="public-profile-main">
        <header className="dashboard-header">
          <div className="header-page">
            {isOwner ? "Meu perfil" : "Explorar"}
          </div>

          <div className="header-actions">
            <button
              className="Notifications-button"
              aria-label="Notificações"
              onClick={() => navigate("/notifications")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications_none
              </span>
              <i />
            </button>

            <button
              className="profile-button"
              aria-label="Perfil"
              onClick={() => navigate("/profile")}
            >
              <span className="profile-avatar marina-avatar">{user.inicial}</span>
              <strong>{user.nome}</strong>
            </button>

            <button
              className="create-post-button"
              onClick={() => navigate("/new-post")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Criar uma publicação
            </button>
          </div>
        </header>

        <div className="public-profile-content">
          <button className="public-back" onClick={goBack}>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
            Voltar
          </button>

          <section className="profile-hero">
            <div className="profile-user">
              <div
                className="public-avatar"
                style={{ background: profile.avatar }}
              >
                {profile.initial}
              </div>

              <div>
                <p className="member-label">MEMBRO DESDE {profile.member}</p>
                <h1>{profile.name}</h1>
                {isOwner && <p className="member-label">{profile.city}</p>}
              </div>
            </div>

            {isOwner ? (
              <button
                className="propose-button"
                onClick={() => navigate("/editprofile")}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  edit
                </span>
                Editar perfil
              </button>
            ) : (
              <button className="propose-button" onClick={sendProposal}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  send
                </span>
                Enviar Proposta
              </button>
            )}
          </section>

          <div className="profile-grid">
            <div className="profile-left">
              <section className="public-card about-card">
                <h2>Sobre mim</h2>
                <p>{profile.about}</p>
              </section>

              <section className="public-card skills-card">
                <h2>Habilidades</h2>
                <div>
                  <p>O QUE OFERECE</p>
                  <div className="skill-list">
                    {isOwner && !profile.offered.length && <small>Ainda não informado</small>}
                    {profile.offered.map((skill) => (
                      <span key={skill} className="skill offer-skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p>O QUE PROCURA</p>
                  <div className="skill-list">
                    {isOwner && !profile.looking.length && <small>Ainda não informado</small>}
                    {profile.looking.map((skill) => (
                      <span key={skill} className="skill looking-skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="public-card reviews-card">
                <div className="reviews-heading">
                  <h2>Avaliações ({profile.reviews.length})</h2>
                  <Stars amount={isOwner ? 0 : 5} />
                </div>

                {isOwner && <p>Você ainda não recebeu avaliações.</p>}
                {profile.reviews.map((review) => (
                  <article className="public-review" key={review.name}>
                    <div className="review-line">
                      <div className="review-avatar">{review.initials}</div>

                      <div className="review-author">
                        <strong>{review.name}</strong>
                        <small>{review.time}</small>
                      </div>

                      <Stars amount={review.stars} />
                    </div>

                    <p>{review.text}</p>

                    <div className="review-tags">
                      {review.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </section>
            </div>

            <aside className="profile-stats public-card">
              <h3>REPUTAÇÃO</h3>
              <strong className="reputation-number">{profile.rating}</strong>
              <Stars amount={isOwner ? 0 : 5} />
              <small>{profile.reviewCount}</small>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
