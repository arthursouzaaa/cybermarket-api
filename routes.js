import { Router } from 'express';
import { listarProdutos, criarProduto } from './Controllers/produtoController.js';
import { adicionarAoCarrinho, verCarrinho } from './Controllers/carrinhoController.js';
import { finalizarPedido } from './Controllers/pedidoController.js';

const router = Router();

router.get('/produtos', listarProdutos);
router.post('/produtos', criarProduto);

router.post('/carrinho', adicionarAoCarrinho);
router.get('/carrinho/:idUsuario', verCarrinho);

router.post('/pedidos', finalizarPedido);

export default router;
