import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  const col = mongoose.connection.collection('produtos');

  const docs = await col.find({}).toArray();
  console.log(`Total de produtos: ${docs.length}\n`);
  docs.forEach((d, i) => {
    console.log(`--- produto ${i + 1} ---`);
    console.log(JSON.stringify(d, null, 2));
  });

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });