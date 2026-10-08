import 'dotenv/config';
import { createClient } from 'redis';

async function main() {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: false }
  });
  await client.connect();

  const chaves = await client.keys('carrinho:*');
  console.log('\n📦 Chaves encontradas:', chaves.length ? chaves : '(nenhuma)');

  for (const k of chaves) {
    const ttl = await client.ttl(k);
    const itens = await client.lRange(k, 0, -1);
    console.log(`\n🔑 ${k}  —  TTL: ${ttl}s`);
    itens.forEach(i => console.log('   →', i));
  }

  await client.disconnect();
}

main().catch(e => { console.error('🔴 Erro:', e.message); process.exit(1); });