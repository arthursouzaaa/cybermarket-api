import { pool } from '../config/supabase.js';
import redisClient from '../config/redis.js';

const pedidosEmMemoria = [];

export const finalizarPedido = async (req, res) => {
  try {
    const { idUsuario, total } = req.body;

    if (!idUsuario || total == null) {
      return res.status(400).json({ erro: 'idUsuario e total são obrigatórios.' });
    }

    // 1) Grava o pedido no Supabase
    const { rows } = await pool.query(
      'INSERT INTO pedidos (id_usuario, total) VALUES ($1, $2) RETURNING id',
      [idUsuario, total]
    );

    // 2) Limpa o carrinho temporário no Redis
    let carrinhoLimpo = false;
    try {
      if (redisClient && redisClient.isOpen) {
        const removidas = await redisClient.del(`carrinho:${idUsuario}`);
        carrinhoLimpo = removidas > 0;
        console.log(`🧹 [Redis] - Carrinho de ${idUsuario} limpo (${removidas} chave(s)).`);
      }
    } catch (errRedis) {
      console.warn('⚠️ [Redis] - Não foi possível limpar o carrinho:', errRedis.message);
    }

    return res.status(201).json({
      mensagem: 'Pagamento Aprovado e Salvo no Relacional!',
      id_pedido: rows[0].id,
      carrinho_limpo: carrinhoLimpo
    });
  } catch (erro) {
    console.error('🔴 [Supabase] - Falha ao salvar pedido:', erro.message);

    const { idUsuario, total } = req.body;
    const pedido = {
      id_pedido: pedidosEmMemoria.length + 1,
      idUsuario,
      total,
      data_compra: new Date().toISOString()
    };
    pedidosEmMemoria.push(pedido);
    return res.status(201).json({
      mensagem: 'Supabase indisponível; pedido registrado em memória.',
      id_pedido: pedido.id_pedido,
      pedido
    });
  }
};