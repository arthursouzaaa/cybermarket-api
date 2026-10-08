import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import conectarMongo from './config/mongo.js';
import conectarSupabase from './config/supabase.js';

import rotas from './routes.js';

const app = express();

app.use(cors({
  origin: true,           // aceita qualquer origem (útil pra dev)
  credentials: true
}));
app.use(express.json());
app.use('/api', rotas);

async function boot() {
  console.log("⚡ Iniciando a Operação Poliglota...");
  await conectarMongo();
  await conectarSupabase();
}
boot();

app.get('/', (req, res) => {
  res.json({ mensagem: "Bem-vindo a API do CyberMarket!" });
});

const PORTA = process.env.PORTA_API || 3000;
app.listen(PORTA, () => {
  console.log(`🚀 Servidor voando na porta http://localhost:${PORTA}`);
});