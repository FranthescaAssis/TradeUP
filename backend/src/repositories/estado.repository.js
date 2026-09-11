import { pool } from "../config/database.js";

export async function getAllEstados() {
  const { rows } = await pool.query(
    'SELECT id, sigla, nome FROM estado ORDER BY nome'
  );
  return rows;
}
