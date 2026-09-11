import { pool } from "../config/database.js";

export async function getAllUsuarios() {
  const { rows } = await pool.query(
    'SELECT id_usuario, nome, email, cidade_id FROM usuario ORDER BY nome'
  );
  return rows;
}

export async function getUsuarioByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id_usuario, email FROM usuario WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function createUsuario({ nome, email, senhaHash, cidadeId }) {
  const { rows } = await pool.query(
    `INSERT INTO usuario (nome, email, senha, cidade_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id_usuario, nome, email, cidade_id, data_cadastro, status`,
    [nome, email, senhaHash, cidadeId]
  );
  return rows[0]; // nunca retornamos o hash da senha
}
