import { Router } from 'express';
import { listarProdutos, criarProduto } from './Controllers/produtoController.js';
import { adicionarAoCarrinho, verCarrinho } from './Controllers/carrinhoController.js';
import { finalizarPedido } from './Controllers/pedidoController.js';
import { verCarrinhosRedis, verPedidosSupabase, verProdutosMongo } from './Controllers/adminController.js';

const router = Router();

router.get('/produtos', listarProdutos);
router.post('/produtos', criarProduto);

router.post('/carrinho', adicionarAoCarrinho);
router.get('/carrinho/:idUsuario', verCarrinho);

router.post('/pedidos', finalizarPedido);

router.get('/admin/redis/carrinhos', verCarrinhosRedis);
router.get('/admin/supabase/pedidos', verPedidosSupabase);
router.get('/admin/mongo/produtos', verProdutosMongo);

export default router;