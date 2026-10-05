import mongoose from 'mongoose';

const produtosEmMemoria = [
    { _id: 'prod-01', nome: 'Teclado Mecânico', preco: 249.9 },
    { _id: 'prod-02', nome: 'Mouse Gamer', preco: 179.9 },
    { _id: 'prod-03', nome: 'Monitor 27"', preco: 1299.9 }
];

const ProdutoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    preco: { type: Number, required: true }
}, { strict: false, versionKey: false });

const Produto = mongoose.model('Produto', ProdutoSchema, 'produtos');

export const listarProdutos = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(produtosEmMemoria);
        }

        const produtos = await Produto.find();
        return res.status(200).json(produtos.length ? produtos : produtosEmMemoria);
    } catch (erro) {
        return res.status(200).json(produtosEmMemoria);
    }
};

export const criarProduto = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const novo = {
                _id: `prod-${Date.now()}`,
                ...req.body,
                preco: Number(req.body.preco)
            };
            produtosEmMemoria.push(novo);
            return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novo });
        }

        const novo = await Produto.create(req.body);
        return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novo });
    } catch (erro) {
        const novo = {
            _id: `prod-${Date.now()}`,
            ...req.body,
            preco: Number(req.body.preco)
        };
        produtosEmMemoria.push(novo);
        return res.status(201).json({ mensagem: 'Produto salvo em memória (Mongo indisponível).', produto: novo });
    }
};