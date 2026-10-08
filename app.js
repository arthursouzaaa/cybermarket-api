/* =========================================================
   CyberMarket — app.js
   Faz todas as chamadas à API (http://localhost:3000/api)
   ========================================================= */

const API = 'http://localhost:3000/api';

let usuario = '';
let carrinho = [];
let ttlInterval = null;

/* ====================== LOG PANEL ====================== */
const coresBanco = {
  MONGO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  REDIS: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  SQL:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function log(banco, mensagem, detalhe = '') {
  const body = document.getElementById('log-body');
  if (!body) return;
  // Limpa o placeholder "Aguardando ações..."
  const placeholder = body.querySelector('.text-slate-500');
  if (placeholder && body.children.length === 1) body.innerHTML = '';

  const el = document.createElement('div');
  const hora = new Date().toLocaleTimeString('pt-BR');
  el.className = 'flex items-start gap-2 slide-up';
  el.innerHTML = `
    <span class="text-slate-600 shrink-0">${hora}</span>
    <span class="badge ${coresBanco[banco]} shrink-0">${banco}</span>
    <span class="text-slate-300 break-all">${mensagem}</span>
    ${detalhe ? `<span class="text-slate-500 break-all">— ${detalhe}</span>` : ''}
  `;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

function toggleLog() {
  const body = document.getElementById('log-body');
  const icone = document.getElementById('icone-log');
  body.classList.toggle('hidden');
  icone.style.transform = body.classList.contains('hidden') ? 'rotate(-90deg)' : '';
}

/* ======================== TOAST ======================== */
function toast(msg, tipo = 'info') {
  const cores = {
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
    ok:   'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    err:  'border-red-500/40 bg-red-500/10 text-red-200',
  };
  const el = document.createElement('div');
  el.className = `glass border ${cores[tipo]} rounded-xl px-4 py-3 text-sm max-w-xs slide-up`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ======================= UTIL ======================= */
function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
}

/* ====================== USUÁRIO ====================== */
function salvarUsuario() {
  const v = document.getElementById('input-usuario').value.trim();
  if (!v) return toast('Digite um nome de usuário.', 'err');
  usuario = v;
  document.getElementById('usuario-status').innerHTML =
    `Logado como <span class="text-neon-blue font-semibold">${usuario}</span>`;
  document.getElementById('drawer-usuario').textContent = `usuário: ${usuario}`;
  log('REDIS', 'Usuário definido para o carrinho', usuario);
  carregarCarrinho();
}

/* ====================== PRODUTOS ====================== */
async function carregarProdutos() {
  const grid = document.getElementById('grid-produtos');
  grid.innerHTML = '<div class="glass rounded-2xl h-[360px] animate-pulse"></div>'.repeat(3);

  try {
    const res = await fetch(`${API}/produtos`);
    const produtos = await res.json();
    log('MONGO', `GET /produtos — ${produtos.length} itens`);

    grid.innerHTML = produtos.map(p => `
      <article class="glass rounded-2xl overflow-hidden card-hover border border-white/5 hover:border-neon-blue/40 hover:glow-blue group">
        <div class="relative h-52 bg-gradient-to-br from-ink-800 to-ink-950 overflow-hidden">
          ${p.imagem
            ? `<img src="${p.imagem}" alt="${p.nome}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.style.display='none'"/>`
            : ''}
          <div class="absolute top-3 right-3">
            <span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MONGO</span>
          </div>
        </div>
        <div class="p-5">
          <h4 class="text-white font-bold text-lg mb-1 truncate">${p.nome}</h4>
          <p class="text-xs text-slate-500 font-mono mb-4">${p._id}</p>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-500">Preço</p>
              <p class="text-2xl font-black bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                ${formatBRL(p.preco)}
              </p>
            </div>
            <button onclick='adicionarAoCarrinho(${JSON.stringify(p).replace(/'/g, "&apos;")})'
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple hover:opacity-90 transition flex items-center justify-center glow-blue">
              <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-16">Erro ao carregar produtos: ${e.message}</div>`;
    toast('Falha ao carregar catálogo', 'err');
    log('MONGO', `Erro GET /produtos — ${e.message}`);
  }
}

/* ====================== CARRINHO ====================== */
async function adicionarAoCarrinho(produto) {
  if (!usuario) {
    toast('Defina seu nome no topo antes de comprar.', 'err');
    document.getElementById('input-usuario').focus();
    return;
  }
  try {
    const res = await fetch(`${API}/carrinho`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: usuario,
        produto: produto.nome,
        quantidade: 1,
        preco: produto.preco
      })
    });
    const data = await res.json();
    log('REDIS', `POST /carrinho — ${produto.nome}`, `TTL ${data.ttl_segundos}s`);
    toast(`${produto.nome} adicionado!`, 'ok');
    await carregarCarrinho();
    abrirCarrinho();
  } catch (e) {
    log('REDIS', `Erro POST /carrinho — ${e.message}`);
    toast('Erro ao adicionar ao carrinho', 'err');
  }
}

async function carregarCarrinho() {
  if (!usuario) return;
  try {
    const res = await fetch(`${API}/carrinho/${usuario}`);
    const data = await res.json();
    carrinho = data.itens || [];
    log('REDIS', `GET /carrinho/${usuario} — ${carrinho.length} item(ns)`,
        data.ttl_segundos ? `TTL ${data.ttl_segundos}s` : '');
    renderCarrinho(data.ttl_segundos);
  } catch (e) {
    log('REDIS', `Erro GET /carrinho — ${e.message}`);
  }
}

function renderCarrinho(ttl) {
  const lista = document.getElementById('lista-carrinho');
  const badge = document.getElementById('badge-carrinho');
  const total = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);

  badge.textContent = carrinho.length;
  badge.classList.toggle('hidden', carrinho.length === 0);

  document.getElementById('valor-total').textContent = formatBRL(total);
  document.getElementById('btn-checkout').disabled = carrinho.length === 0;

  if (carrinho.length === 0) {
    lista.innerHTML = `
      <div class="text-center text-slate-500 py-16">
        <svg viewBox="0 0 24 24" class="w-14 h-14 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.7 13.4A2 2 0 0 0 9.7 16H19a2 2 0 0 0 2-1.6L23 6H6"/>
        </svg>
        <p class="text-sm">Carrinho vazio</p>
        <p class="text-xs mt-1">Adicione produtos do catálogo</p>
      </div>`;
    pararTimerTTL();
    document.getElementById('aviso-ttl').classList.add('hidden');
    document.getElementById('aviso-ttl').classList.remove('flex');
    return;
  }

  lista.innerHTML = carrinho.map((i, idx) => `
    <div class="glass rounded-xl p-3 flex gap-3 items-center slide-up">
      <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center shrink-0">
        <span class="text-xs font-mono text-neon-blue">${String(idx + 1).padStart(2, '0')}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-white font-semibold truncate text-sm">${i.produto}</p>
        <p class="text-xs text-slate-500">Qtd: ${i.quantidade} × ${formatBRL(i.preco)}</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-white font-bold">${formatBRL(i.preco * i.quantidade)}</p>
      </div>
    </div>
  `).join('');

  if (ttl && ttl > 0) iniciarTimerTTL(ttl);
  else pararTimerTTL();
}

/* ====================== TTL TIMER ====================== */
function iniciarTimerTTL(segundos) {
  const aviso = document.getElementById('aviso-ttl');
  const el = document.getElementById('ttl-valor');
  aviso.classList.remove('hidden');
  aviso.classList.add('flex');

  pararTimerTTL();
  let restante = segundos;
  const atualizar = () => {
    const m = Math.floor(restante / 60);
    const s = restante % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (restante <= 0) {
      pararTimerTTL();
      carregarCarrinho();
      return;
    }
    restante--;
  };
  atualizar();
  ttlInterval = setInterval(atualizar, 1000);
}

function pararTimerTTL() {
  if (ttlInterval) {
    clearInterval(ttlInterval);
    ttlInterval = null;
  }
}

/* ====================== DRAWER ====================== */
function abrirCarrinho() {
  document.getElementById('drawer').classList.remove('translate-x-full');
  document.getElementById('overlay').classList.remove('hidden');
  if (usuario) carregarCarrinho();
}

function fecharCarrinho() {
  document.getElementById('drawer').classList.add('translate-x-full');
  document.getElementById('overlay').classList.add('hidden');
}

/* ====================== CHECKOUT ====================== */
async function finalizarCompra() {
  if (!usuario || carrinho.length === 0) return;

  const total = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);
  const btn = document.getElementById('btn-checkout');
  btn.disabled = true;
  btn.textContent = 'Processando...';

  try {
    const res = await fetch(`${API}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuario: usuario, total })
    });
    const data = await res.json();

    log('SQL', `POST /pedidos — total ${formatBRL(total)}`, `pedido #${data.id_pedido}`);

    document.getElementById('pedido-id').textContent = `#${data.id_pedido}`;
    document.getElementById('modal-sucesso').classList.remove('hidden');
    document.getElementById('modal-sucesso').classList.add('flex');

    // Esvazia o carrinho local e atualiza (o back já limpou o Redis)
    carrinho = [];
    await carregarCarrinho();
    toast('Pedido criado com sucesso!', 'ok');
  } catch (e) {
    log('SQL', `Erro POST /pedidos — ${e.message}`);
    toast('Falha ao finalizar pedido', 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Finalizar Compra';
  }
}

function fecharSucesso() {
  document.getElementById('modal-sucesso').classList.add('hidden');
  document.getElementById('modal-sucesso').classList.remove('flex');
}

/* ====================== BOOT ====================== */
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  log('MONGO', 'Catálogo carregado do MongoDB');
});