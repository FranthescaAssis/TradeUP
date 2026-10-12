import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import OnboardingStep01 from "./pages/OnboardingStep01.jsx";
import OnboardingStep02 from "./pages/OnboardingStep02.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Explore from "./pages/Explore.jsx";
import Proposal from "./pages/Proposal.jsx";
import MyTrades from "./pages/Mytrades.jsx";
import TradeDetails from "./pages/TradeDetails.jsx";
import ReceivedProposal from "./pages/ReceivedProposal.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import ProposalProfile from "./pages/ProposalProfile.jsx";
import NewPost from "./components/NewPost.jsx";
import Review from "./pages/Review.jsx";
import Chat from "./pages/Chat.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Settings from "./pages/Settings.jsx";
import Notifications from "./Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";
import SessionGate from "./components/SessionGate.jsx";
import { useFeedback } from "./components/Feedback.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { publicacoesApi } from "./services/api.js";

// ---------------------------------------------------------------- tipos de rota
// Públicas ("/", "/forgotpassword", "/resetpassword"): qualquer pessoa abre, não precisam de lista.
// Só visitante: quem já está conectado é levado ao painel.
// Privadas: exigem login (qualquer outra rota não listada aqui cai na página 404).
const GUEST_ONLY_PATHS = new Set(["/login", "/cadastro"]);
const PRIVATE_PATHS = new Set([
  "/onboarding/step01",
  "/onboarding/step02",
  "/dashboard",
  "/explore",
  "/proposal",
  "/mytrades",
  "/tradedetails",
  "/receivedproposal",
  "/review",
  "/chat",
  "/profile",
  "/publicprofile",
  "/proposalprofile",
  "/editprofile",
  "/settings",
  "/notifications",
]);

function cleanPath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function getRoute() {
  return {
    path: cleanPath(window.location.pathname),
    search: window.location.search,
  };
}

// "next" vem da URL (/login?next=/chat). Só aceitamos caminhos internos e privados,
// para ninguém conseguir montar um link que leve o usuário a outro site depois do login.
function readNext(search) {
  const next = new URLSearchParams(search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const path = cleanPath(new URL(next, window.location.origin).pathname);
  return PRIVATE_PATHS.has(path) ? next : null;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const { path, search } = route;
  const auth = useAuth();
  const [postsVersion, setPostsVersion] = useState(0); // muda a cada publicação criada, para a lista recarregar
  const { notify } = useFeedback();

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path, search]);

  function navigate(to, { replace = false } = {}) {
    if (to === "/new-post") {
      setNewPostOpen(true);
      return;
    }

    const url = new URL(to, window.location.origin);
    const target = cleanPath(url.pathname) + url.search;
    const current = cleanPath(window.location.pathname) + window.location.search;

    setNewPostOpen(false);

    if (target === current) return;

    window.history[replace ? "replaceState" : "pushState"]({}, "", target);
    setRoute({ path: cleanPath(url.pathname), search: url.search });
  }

  // ---------------------------------------------------------------- proteção de rotas
  useEffect(() => {
    if (auth.status === "anonymous" && PRIVATE_PATHS.has(path)) {
      // Saiu de propósito: vai ao login limpo. Sessão vencida: o login lembra a página para voltar.
      const next = auth.motivo === "logout" ? "" : `?next=${encodeURIComponent(path + search)}`;
      navigate(`/login${next}`, { replace: true });
    } else if (auth.status === "authenticated" && GUEST_ONLY_PATHS.has(path)) {
      navigate(readNext(search) ?? "/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, auth.motivo, path, search]);

  // Se a API recusar, o erro sobe para o formulário (NewPost), que o mostra e mantém o texto digitado.
  async function handleCreatePost(dados) {
    await publicacoesApi.criar(dados);
    setNewPostOpen(false);
    setPostsVersion((v) => v + 1);
    notify("success", "Publicação criada com sucesso!");
  }

  function renderPage() {
    const isPrivate = PRIVATE_PATHS.has(path);
    const isGuestOnly = GUEST_ONLY_PATHS.has(path);

    if (isPrivate && !auth.isAuthenticated) {
      return <SessionGate status={auth.status} onRetry={auth.retry} navigate={navigate} />;
    }
    if (isGuestOnly && (auth.status === "loading" || auth.isAuthenticated)) {
      return <SessionGate status="loading" navigate={navigate} />;
    }

    if (path === "/") return <Home navigate={navigate} />;
    if (path === "/login") return <Login navigate={navigate} />;
    if (path === "/cadastro") return <Signup navigate={navigate} />;
    if (path === "/forgotpassword") return <ForgotPassword navigate={navigate} />;
    if (path === "/resetpassword") return <ResetPassword navigate={navigate} />;

    if (path === "/onboarding/step01") return <OnboardingStep01 navigate={navigate} />;
    if (path === "/onboarding/step02") return <OnboardingStep02 navigate={navigate} />;
    if (path === "/dashboard") return <Dashboard navigate={navigate} reloadKey={postsVersion} />;
    if (path === "/explore") return <Explore navigate={navigate} reloadKey={postsVersion} />;
    if (path === "/proposal") return <Proposal navigate={navigate} />;
    if (path === "/mytrades") return <MyTrades navigate={navigate} />;
    if (path === "/tradedetails") return <TradeDetails navigate={navigate} />;
    if (path === "/receivedproposal") return <ReceivedProposal navigate={navigate} />;
    if (path === "/review") return <Review navigate={navigate} />;
    if (path === "/chat") return <Chat navigate={navigate} />;
    if (path === "/profile") return <PublicProfile key="me" navigate={navigate} isOwner />;
    if (path === "/publicprofile") return <PublicProfile key={search} navigate={navigate} />;
    if (path === "/editprofile") return <EditProfile navigate={navigate} />;
    if (path === "/settings") return <Settings navigate={navigate} />;
    if (path === "/notifications") return <Notifications navigate={navigate} />;
    if (path === "/proposalprofile") return <ProposalProfile navigate={navigate} />;

    return <NotFound navigate={navigate} isAuthenticated={auth.isAuthenticated} />;
  }

  return (
    <>
      {renderPage()}

      {auth.isAuthenticated && (
        <NewPost open={newPostOpen} onClose={() => setNewPostOpen(false)} onSubmit={handleCreatePost} />
      )}
    </>
  );
}
