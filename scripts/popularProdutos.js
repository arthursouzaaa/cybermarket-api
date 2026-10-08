import 'dotenv/config';
import mongoose from 'mongoose';

const produtos = [
  {
    _id: 'prod-01',
    nome: 'Teclado Mecânico',
    preco: 249.9,
    imagem: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
  },
  {
    _id: 'prod-02',
    nome: 'Mouse Gamer',
    preco: 179.9,
    imagem: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80'
  },
  {
    _id: 'prod-03',
    nome: 'Monitor 27"',
    preco: 1299.9,
    imagem: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=80'
  }
];

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  const col = mongoose.connection.collection('produtos');

  // Limpa o que tiver (pra não duplicar em execuções repetidas)
  await col.deleteMany({});

  // Insere os 3 produtos
  const r = await col.insertMany(produtos);
  console.log(`✅ ${Object.keys(r.insertedIds).length} produtos inseridos.`);

  // Confirma
  const total = await col.countDocuments();
  console.log(`📦 Total agora na coleção: ${total}`);

  await mongoose.disconnect();
}

main().catch(e => { console.error('🔴 Erro:', e.message); process.exit(1); });