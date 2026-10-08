import 'dotenv/config';
import mongoose from 'mongoose';

const imagens = {
  'prod-01': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  'prod-02': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&q=80',
  'prod-03': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&q=80'
};

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  const col = mongoose.connection.collection('produtos');

  for (const [id, imagem] of Object.entries(imagens)) {
    const r = await col.updateOne(
      { _id: id },
      { $set: { imagem } }
    );
    console.log(`[${id}] modificados: ${r.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log('✅ Pronto!');
}

main().catch(e => { console.error(e); process.exit(1); });