const deals = [];

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderDeals() {
  const tbody = document.getElementById('deals-body');
  const emptyRow = document.getElementById('empty-row');
  const count = document.getElementById('deal-count');
  count.textContent = deals.length;

  tbody.querySelectorAll('tr.deal-row').forEach(r => r.remove());

  if (deals.length === 0) {
    emptyRow.style.display = '';
    return;
  }
  emptyRow.style.display = 'none';

  deals.forEach((d, i) => {
    const tr = document.createElement('tr');
    tr.className = 'deal-row';
    tr.innerHTML = `
      <td>
        <div class="deal-name">${d.nombre}</div>
        <div class="deal-company">${d.empresa}</div>
      </td>
      <td><span class="deal-value">${formatCurrency(d.valor)}</span></td>
      <td><span class="stage-pill stage-${d.etapa}">${d.etapa.charAt(0).toUpperCase() + d.etapa.slice(1)}</span></td>
      <td>
        ${d.etapa === 'cerrado'
          ? `<button class="btn-contract" onclick="sendContract(${i})">📄 Enviar contrato</button>`
          : '<span style="color:#cbd5e1;font-size:0.8rem">—</span>'
        }
      </td>
      <td style="color:#64748b;font-size:0.8rem">${formatDate(d.fecha)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveDeal(deal) {
  const res = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  });
  if (!res.ok) {
    const msg = await res.text();
    showToast(`Error al guardar el deal: ${msg}`, 'error');
    return;
  }
  showToast('Deal guardado correctamente', 'success');
}

let pendingContractIndex = null;

function sendContract(index) {
  const deal = deals[index];
  pendingContractIndex = index;
  document.getElementById('modal-deal-name').textContent = `${deal.nombre} — ${deal.empresa}`;
  document.getElementById('modal-email').value = deal.email || '';
  document.getElementById('contract-modal').classList.add('open');
  document.getElementById('modal-email').focus();
}

function closeContractModal() {
  document.getElementById('contract-modal').classList.remove('open');
  pendingContractIndex = null;
}

async function confirmSendContract() {
  const email = document.getElementById('modal-email').value.trim();
  if (!email) return;
  const deal = deals[pendingContractIndex];
  closeContractModal();
  const res = await fetch('/api/contracts/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealId: deal.id, recipient: email, dealName: deal.nombre }),
  });
  if (!res.ok) {
    showToast('Error al enviar el contrato', 'error');
    return;
  }
  showToast(`Contrato enviado a ${email}`, 'success');
}

document.getElementById('deal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const deal = {
    nombre: document.getElementById('nombre').value.trim(),
    empresa: document.getElementById('empresa').value.trim(),
    email: document.getElementById('email').value.trim(),
    valor: Number(document.getElementById('valor').value),
    etapa: document.getElementById('etapa').value,
    fecha: new Date().toISOString(),
  };
  deals.push(deal);
  renderDeals();
  e.target.reset();
  await saveDeal(deal);
  if (deal.etapa === 'cerrado') {
    sendContract(deals.length - 1);
  }
});

document.getElementById('contract-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeContractModal();
});

renderDeals();
