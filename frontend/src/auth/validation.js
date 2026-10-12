// Validação dos formulários no navegador, para dar retorno imediato.
// ATENÇÃO: são as mesmas regras de backend/app/esquemas.py, mas o back-end valida tudo de novo
// (o navegador pode ser burlado). Se mudar uma regra aqui, mude lá também.

export const UFS = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "),
);

export const LIMITES = { nome: 100, email: 100, cidade: 100, senhaMin: 8, senhaMaxBytes: 72 };

const compactar = (texto) => texto.replace(/\s+/g, " ").trim();
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PADRAO_CIDADE = /^\p{L}+(?:[ '\-.]+\p{L}+)*\.?$/u;

export function validarNome(valor) {
  const nome = compactar(valor ?? "");
  if (!nome) return "Informe seu nome.";
  if (!/\p{L}/u.test(nome)) return "O nome deve conter letras.";
  if (nome.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (nome.length > LIMITES.nome) return `O nome pode ter no máximo ${LIMITES.nome} caracteres.`;
  return "";
}

export function validarEmail(valor, { checarTamanho = true } = {}) {
  const email = (valor ?? "").trim();
  if (!email) return "Informe seu e-mail.";
  if (checarTamanho && email.length > LIMITES.email) return `O e-mail pode ter no máximo ${LIMITES.email} caracteres.`;
  if (!PADRAO_EMAIL.test(email)) return "Informe um e-mail válido, como voce@email.com.";
  return "";
}

export function validarCidade(valor) {
  const cidade = compactar(valor ?? "");
  if (!cidade) return "Informe sua cidade.";
  if (cidade.length < 2) return "A cidade deve ter pelo menos 2 caracteres.";
  if (cidade.length > LIMITES.cidade) return `A cidade pode ter no máximo ${LIMITES.cidade} caracteres.`;
  if (!PADRAO_CIDADE.test(cidade)) return "A cidade deve conter apenas letras, espaços e hífens.";
  return "";
}

export function validarEstado(valor) {
  const uf = (valor ?? "").trim().toUpperCase();
  if (!uf) return "Informe o estado (UF).";
  if (!UFS.has(uf)) return "UF inválida. Use a sigla do estado, como GO ou SP.";
  return "";
}

export function validarSenhaNova(valor) {
  const senha = valor ?? ""; // a senha não é "aparada": espaços fazem parte dela
  if (!senha) return "Crie uma senha.";
  if (senha.length < LIMITES.senhaMin) return `A senha deve ter pelo menos ${LIMITES.senhaMin} caracteres.`;
  if (new TextEncoder().encode(senha).length > LIMITES.senhaMaxBytes)
    return `A senha é longa demais (máximo de ${LIMITES.senhaMaxBytes} bytes, cerca de ${LIMITES.senhaMaxBytes} letras).`;
  if (!/\p{L}/u.test(senha) || !/\d/.test(senha)) return "A senha deve ter letras e números.";
  return "";
}

export function validarConfirmacao(senha, confirmacao) {
  if (!confirmacao) return "Repita a senha para confirmar.";
  if (senha !== confirmacao) return "As senhas precisam ser iguais.";
  return "";
}

// ---- formulários completos: devolvem { campo: "mensagem" } só com os campos inválidos
export function validarCadastro(v) {
  const erros = {
    name: validarNome(v.name),
    email: validarEmail(v.email),
    city: validarCidade(v.city),
    state: validarEstado(v.state),
    password: validarSenhaNova(v.password),
    confirmation: validarConfirmacao(v.password, v.confirmation),
  };
  return Object.fromEntries(Object.entries(erros).filter(([, msg]) => msg));
}

export function validarLogin(v) {
  const erros = {
    email: validarEmail(v.email, { checarTamanho: false }),
    password: v.password ? "" : "Informe sua senha.",
  };
  return Object.fromEntries(Object.entries(erros).filter(([, msg]) => msg));
}

// Nome do campo no formulário (inglês, como já estava) -> nome do campo na API (português)
export const CAMPO_API = {
  name: "nome",
  email: "email",
  city: "cidade",
  state: "estado",
  password: "senha",
  confirmation: "confirmacao_senha",
};
export const CAMPO_FORM = Object.fromEntries(Object.entries(CAMPO_API).map(([form, api]) => [api, form]));
