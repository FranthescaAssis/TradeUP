import { pool } from "../config/database.js";

export async function getCidadesByEstado(estadoId) {
  const { rows } = await pool.query(
    'SELECT id, nome FROM cidade WHERE estado_id = $1 ORDER BY nome',
    [estadoId]
  );
  return rows;
}

// Busca a cidade junto com o estado (usado para validar o par estado/cidade no cadastro)
export async function getCidadeById(cidadeId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nome, c.estado_id, e.sigla AS estado_sigla, e.nome AS estado_nome
       FROM cidade c
       JOIN estado e ON e.id = c.estado_id
      WHERE c.id = $1`,
    [cidadeId]
  );
  return rows[0] || null;
}
