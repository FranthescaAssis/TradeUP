import axios from 'axios';
import { pool } from '../src/config/database.js';

async function seed() {
  const { data: estados } = await axios.get(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados'
  );

  for (const uf of estados) {
    await pool.query(
      `INSERT INTO estado (id, sigla, nome) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET sigla = EXCLUDED.sigla, nome = EXCLUDED.nome`,
      [uf.id, uf.sigla, uf.nome]
    );

    const { data: municipios } = await axios.get(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.id}/municipios`
    );

    for (const mun of municipios) {
      await pool.query(
        `INSERT INTO cidade (id, nome, estado_id) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, estado_id = EXCLUDED.estado_id`,
        [mun.id, mun.nome, uf.id]
      );
    }
  }
  console.log(`Seed concluído: ${estados.length} estado.`);
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
