import pg from 'pg';
import dns from 'dns';

// Evita problema de IPv6 em redes que não suportam (WSL, alguns roteadores)
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige SSL
});

pool.on('connect', () => {
  console.log('🟣 [Supabase] - Pool conectado ao banco relacional!');
});

pool.on('error', (err) => {
  console.error('🔴 [Supabase] - Erro no pool:', err.message);
});

async function conectarSupabase() {
  try {
    const { rows } = await pool.query('SELECT NOW() AS agora');
    console.log('🟣 [Supabase] - Conectado com sucesso! Hora do banco:', rows[0].agora);
  } catch (erro) {
    console.error('🔴 [Supabase] - Erro de conexão:', erro.message);
  }
}

export { pool };
export default conectarSupabase;