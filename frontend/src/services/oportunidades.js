// Converte publicações vindas da API no formato dos cards de oportunidade.
// Usado pelas telas Explorar e Início, para as duas mostrarem os mesmos dados da mesma forma.

const MODALITY_LABELS = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Online ou presencial",
};

const AVATAR_COLORS = ["#dfaa8c", "#a7c5dc", "#89aa76", "#75a6a0"];

const STATE_NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export function timeAgo(isoDate) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(isoDate)) / 60000));
  if (minutes < 1) return "agora há pouco";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}

export function toCard(post) {
  const request = post.tipo === "necessidade";
  const { autor } = post;
  return {
    id: post.id,
    name: autor.nome,
    time: `${timeAgo(post.data_criacao)} · ${autor.cidade}`,
    title: post.titulo,
    description: post.descricao,
    contrapartida: post.contrapartida, // só nas solicitações: o que o autor oferece em troca
    offerLabel: request ? "Busca" : "Oferece",
    offer: post.categoria,
    wantsLabel: "Modalidade",
    wants: MODALITY_LABELS[post.modalidade],
    tag: request ? "Solicitação" : post.categoria,
    category: post.categoria,
    location: autor.cidade,
    state: autor.estado,
    stateName: STATE_NAMES[autor.estado] ?? "",
    createdAt: post.data_criacao,
    authorId: autor.id,
    avatar: autor.nome.charAt(0).toUpperCase(),
    color: AVATAR_COLORS[autor.id % AVATAR_COLORS.length],
    request,
  };
}
