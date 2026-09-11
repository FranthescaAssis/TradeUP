import bcrypt from 'bcryptjs'; // bcryptjs é compatível com Yarn Berry, bcrypt não é.
import jwt from 'jsonwebtoken';
import { ApiError } from "../utils/apiError.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as cidadeRepository from "../repositories/cidade.repository.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUsuario(dados) {
  const nome = (dados.nome || '').trim();
  const email = (dados.email || '').trim().toLowerCase();
  const estadoId = Number(dados.estadoId);
  const cidadeId = Number(dados.cidadeId);
  const senha = dados.senha || '';
  const confirmarSenha = dados.confirmarSenha || '';

  // ---------- Validações ----------
  if (!nome || nome.length < 3) {
    throw new ApiError(400, 'Nome completo é obrigatório.');
  }
  if (nome.split(/\s+/).length < 2) {
    throw new ApiError(400, 'Informe seu nome completo (nome e sobrenome).');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'E-mail inválido.');
  }
  if (!senha || senha.length < 8) {
    throw new ApiError(400, 'A senha deve ter no mínimo 8 caracteres.');
  }
  if (senha !== confirmarSenha) {
    throw new ApiError(400, 'As senhas não conferem.');
  }
  if (!Number.isInteger(estadoId) || !Number.isInteger(cidadeId) || estadoId <= 0 || cidadeId <= 0) {
    throw new ApiError(400, 'Informe estado e cidade.');
  }

  // ---------- Regras de negócio ----------
  const cidade = await cidadeRepository.getCidadeById(cidadeId);
  if (!cidade) {
    throw new ApiError(400, 'Cidade inválida.');
  }
  if (cidade.estado_id !== estadoId) {
    throw new ApiError(400, 'A cidade selecionada não pertence ao estado informado.');
  }

  const emailExistente = await usuarioRepository.getUsuarioByEmail(email);
  if (emailExistente) {
    throw new ApiError(409, 'Este e-mail já está cadastrado.');
  }

  // ---------- Persistência ----------
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  let usuario;
  try {
    usuario = await usuarioRepository.createUsuario({ nome, email, senhaHash, cidadeId });
  } catch (err) {
    // 23505 = unique_violation (proteção extra caso dois cadastros corram em paralelo)
    if (err.code === '23505') {
      throw new ApiError(409, 'Este e-mail já está cadastrado.');
    }
    throw err;
  }

  // Token para autenticar o usuário logo após o cadastro (opcional — remova se preferir redirecionar ao login)
  const token = jwt.sign(
    { id: usuario.id_usuario, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    usuario: {
      id: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      cidade: {
        id: cidade.id,
        nome: cidade.nome,
        estado: cidade.estado_sigla,
      },
    },
    token,
  };
}
