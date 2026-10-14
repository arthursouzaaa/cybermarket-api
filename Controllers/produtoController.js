import mongoose from 'mongoose';

const produtosEmMemoria = [
    { _id: 'prod-01', nome: 'Teclado Mecânico', preco: 249.9, imagem: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80' },
    { _id: 'prod-02', nome: 'Mouse Gamer', preco: 179.9, imagem: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80' },
    { _id: 'prod-03', nome: 'Monitor 27"', preco: 1299.9, imagem: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=80' }
];

const ProdutoSchema = new mongoose.Schema({
    _id: { type: String },
    nome: { type: String, required: true },
    preco: { type: Number, required: true },
    imagem: { type: String }
}, { strict: false, versionKey: false });

const Produto = mongoose.model('Produto', ProdutoSchema, 'produtos');

export const listarProdutos = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(produtosEmMemoria);
        }
        const produtos = await Produto.find().lean();
        return res.status(200).json(produtos.length ? produtos : produtosEmMemoria);
    } catch (erro) {
        console.error('🔴 [Mongo] - Erro em listarProdutos:', erro.message);
        return res.status(200).json(produtosEmMemoria);
    }
};

export const criarProduto = async (req, res) => {
    try {
        const dados = {
            _id: `prod-${Date.now()}`,
            nome: req.body.nome,
            preco: Number(req.body.preco)
        };
        if (req.body.imagem) dados.imagem = req.body.imagem;

        if (mongoose.connection.readyState !== 1) {
            produtosEmMemoria.push(dados);
            return res.status(201).json({ mensagem: 'Produto criado (memória, Mongo offline)!', produto: dados });
        }

        const novo = await Produto.create(dados);
        console.log('🟢 [Mongo] - Produto gravado no Atlas:', novo._id);
        return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novo });
    } catch (erro) {
        console.error('🔴 [Mongo] - Erro ao criar produto:', erro.message);
        return res.status(500).json({ erro: 'Falha ao criar produto', detalhe: erro.message });
    }
};