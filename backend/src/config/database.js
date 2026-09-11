// Conexão com o PostgreSQL (camada de dados).
// A string de conexão vem da variável DATABASE_URL (ver .env.example).
import pg from "pg";

export const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || '5432',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'tradeup',
});

// export const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}
