import redisClient from '../config/redis.js';

const carrinhosEmMemoria = new Map();
const TTL_CARRINHO_SEGUNDOS = 60 * 30; // 30 minutos

export const adicionarAoCarrinho = async (req, res) => {
  try {
    const { idUsuario, produto, quantidade, preco } = req.body;
    const chave = `carrinho:${idUsuario}`;
    const item = { produto, quantidade, preco };

    if (!redisClient || !redisClient.isOpen) {
      const atual = carrinhosEmMemoria.get(chave) || [];
      atual.push(item);
      carrinhosEmMemoria.set(chave, atual);
      return res.status(200).json({
        mensagem: 'Item adicionado ao carrinho temporário em memória!',
        carrinho: atual
      });
    }

    await redisClient.lPush(chave, JSON.stringify(item));
    await redisClient.expire(chave, TTL_CARRINHO_SEGUNDOS);

    return res.status(200).json({
      mensagem: 'Item adicionado ao carrinho temporário!',
      ttl_segundos: TTL_CARRINHO_SEGUNDOS
    });
  } catch (erro) {
    console.error('🔴 [Redis] - Erro ao adicionar:', erro.message);
    const { idUsuario, produto, quantidade, preco } = req.body;
    const chave = `carrinho:${idUsuario}`;
    const atual = carrinhosEmMemoria.get(chave) || [];
    atual.push({ produto, quantidade, preco });
    carrinhosEmMemoria.set(chave, atual);
    return res.status(200).json({
      mensagem: 'Redis indisponível; item salvo em memória.',
      carrinho: atual
    });
  }
};

export const verCarrinho = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const chave = `carrinho:${idUsuario}`;

    if (!redisClient || !redisClient.isOpen) {
      const itens = carrinhosEmMemoria.get(chave) || [];
      return res.status(200).json({ usuario: idUsuario, itens });
    }

    const itens = await redisClient.lRange(chave, 0, -1);
    const itensFormatados = itens.map(i => JSON.parse(i));
    const ttl = await redisClient.ttl(chave);

    return res.status(200).json({
      usuario: idUsuario,
      itens: itensFormatados,
      ttl_segundos: ttl > 0 ? ttl : 0
    });
  } catch (erro) {
    console.error('🔴 [Redis] - Erro ao ver carrinho:', erro.message);
    const { idUsuario } = req.params;
    const itens = carrinhosEmMemoria.get(`carrinho:${idUsuario}`) || [];
    return res.status(200).json({ usuario: idUsuario, itens });
  }
};