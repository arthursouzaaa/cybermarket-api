import mongoose from 'mongoose';
import redisClient from '../config/redis.js';
import { pool } from '../config/supabase.js';

export const verCarrinhosRedis = async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(200).json({ carrinhos: [], aviso: 'Redis offline' });
    }
    const chaves = await redisClient.keys('carrinho:*');
    const carrinhos = [];
    for (const chave of chaves) {
      const ttl = await redisClient.ttl(chave);
      const itens = await redisClient.lRange(chave, 0, -1);
      carrinhos.push({
        chave,
        usuario: chave.replace('carrinho:', ''),
        ttl_segundos: ttl,
        itens: itens.map(i => JSON.parse(i))
      });
    }
    return res.status(200).json({ carrinhos });
  } catch (erro) {
    console.error('🔴 [Redis] - Erro admin:', erro.message);
    return res.status(500).json({ erro: erro.message });
  }
};

export const verPedidosSupabase = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, id_usuario, total, data_compra FROM pedidos ORDER BY id DESC LIMIT 5'
    );
    const { rows: totalRows } = await pool.query('SELECT COUNT(*)::int AS total FROM pedidos');
    return res.status(200).json({ total: totalRows[0].total, pedidos: rows });
  } catch (erro) {
    console.error('🔴 [Supabase] - Erro admin:', erro.message);
    return res.status(500).json({ erro: erro.message });
  }
};

export const verProdutosMongo = async (req, res) => {
  try {
    const col = mongoose.connection.collection('produtos');
    const total = await col.countDocuments();
    const nomes = await col.find({}, { projection: { nome: 1, _id: 0 } }).limit(10).toArray();
    return res.status(200).json({ total, nomes: nomes.map(n => n.nome) });
  } catch (erro) {
    console.error('🔴 [Mongo] - Erro admin:', erro.message);
    return res.status(500).json({ erro: erro.message });
  }
};