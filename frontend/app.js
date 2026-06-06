const API = 'http://localhost:3000/api';
let abaAtual = 'dashboard';

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error('Erro API:', url, err);
    return [];
  }
}

function mostrarAba(aba, btn) {
  abaAtual = aba;
  document.querySelectorAll('.menu-item').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  const titles = {
    dashboard: ['Dashboard', 'Painel Geral'],
    projects: ['Projects', 'Obras'],
    employees: ['Employees', 'Funcionários'],
    services: ['Services', 'Serviços'],
    daily: ['Daily Report', 'Diário de Obra'],
    quotes: ['Quotes', 'Orçamentos'],
    materials: ['Materials', 'Materiais'],
    tools: ['Tools', 'Ferramentas'],
    financial: ['Financial', 'Financeiro'],
    schedule: ['Schedule', 'Agenda'],
    marketing: ['Marketing', 'Marketing'],
    admin: ['Admin', 'Administração']
  };
  document.getElementById('page-title').textContent = titles[aba][0];
  document.getElementById('page-subtitle').textContent = titles[aba][1];
  carregarDadosAba();
}

async function carregarDadosAba() {
  const content = document.getElementById('content');
  content.innerHTML = '<div style="padding:20px;">Loading... / Carregando...</div>';
  
  if (abaAtual === 'dashboard') {
    const projects = await safeFetch(API + '/projects');
    const employees = await safeFetch(API + '/employees');
    const financial = await safeFetch(API + '/financial');
    
    const activeProjects = (projects || []).filter(p => p.status === 'In Progress').length;
    const totalEmployees = (employees || []).length;
    const income = (financial || []).filter(f => f.type === 'Income').reduce((sum, f) => sum + (Number(f.value_usd) || 0), 0);
    const expense = (financial || []).filter(f => f.type === 'Expense').reduce((sum, f) => sum + (Number(f.value_usd) || 0), 0);
    const profit = income - expense;
    
    content.innerHTML = '<div class="cards">' +
      '<div class="card"><div class="card-title">ACTIVE PROJECTS</div><div class="card-subtitle">Obras Ativas</div><div class="card-value">' + activeProjects + '</div></div>' +
      '<div class="card"><div class="card-title">EMPLOYEES</div><div class="card-subtitle">Funcionários</div><div class="card-value">' + totalEmployees + '</div></div>' +
      '<div class="card"><div class="card-title">NET PROFIT</div><div class="card-subtitle">Lucro Líquido</div><div class="card-value">$' + profit.toFixed(2) + '</div></div>' +
      '<div class="card"><div class="card-title">TOTAL INCOME</div><div class="card-subtitle">Receita Total</div><div class="card-value">$' + income.toFixed(2) + '</div></div>' +
      '</div>';
  }
  
  if (abaAtual === 'financial') {
    const data = await safeFetch(API + '/financial');
    let html = '<button class="btn" onclick="adicionarLancamento()">Add Entry / Adicionar Lançamento</button>';
    html += '<table><tr><th>Date<br><small>Data</small></th><th>Type<br><small>Tipo</small></th><th>Description<br><small>Descrição</small></th><th>Value USD<br><small>Valor USD</small></th><th>Category<br><small>Categoria</small></th></tr>';
    data.forEach(f => {
      html += '<tr><td>' + (f.date || '') + '</td><td>' + (f.type || '') + '</td><td>' + (f.description || '') + '</td><td>$' + (Number(f.value_usd) || 0).toFixed(2) + '</td><td>' + (f.category || '') + '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'employees') {
    const data = await safeFetch(API + '/employees');
    let html = '<button class="btn" onclick="adicionarFuncionario()">Add Employee / Adicionar Funcionário</button>';
    html += '<table><tr><th>Name<br><small>Nome</small></th><th>SIN<br><small>SIN</small></th><th>Role<br><small>Cargo</small></th><th>Hourly Rate<br><small>Valor Hora</small></th><th>Phone<br><small>Telefone</small></th></tr>';
    data.forEach(e => {
      html += '<tr><td>' + (e.name || '') + '</td><td>' + (e.sin_number || '') + '</td><td>' + (e.role || '') + '</td><td>$' + (Number(e.hourly_rate) || 0).toFixed(2) + '</td><td>' + (e.phone || '') + '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'projects') {
    const data = await safeFetch(API + '/projects');
    let html = '<button class="btn" onclick="adicionarObra()">Add Project / Adicionar Obra</button>';
    html += '<table><tr><th>Client<br><small>Cliente</small></th><th>Address<br><small>Endereço</small></th><th>Start Date<br><small>Data Início</small></th><th>Status<br><small>Status</small></th><th>Value USD<br><small>Valor USD</small></th></tr>';
    data.forEach(p => {
      html += '<tr><td>' + (p.client || '') + '</td><td>' + (p.address || '') + '</td><td>' + (p.start_date || '') + '</td><td>' + (p.status || '') + '</td><td>$' + (Number(p.total_value_usd) || 0).toFixed(2) + '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
}

async function adicionarLancamento() {
  const date = prompt('Date / Data (YYYY-MM-DD):');
  const type = prompt('Type / Tipo (Income/Expense):');
  const description = prompt('Description / Descrição:');
  const value_usd = prompt('Value USD / Valor USD:');
  const category = prompt('Category / Categoria:');
  if (!date ||!type) return;
  await fetch(API + '/financial', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({date, type, description, value_usd: parseFloat(value_usd) || 0, category})
  });
  carregarDadosAba();
}

async function adicionarFuncionario() {
  const name = prompt('Name / Nome:');
  const sin_number = prompt('SIN Number / Número SIN:');
  const role = prompt('Role / Cargo:');
  const hourly_rate = prompt('Hourly Rate / Valor Hora:');
  const phone = prompt('Phone / Telefone:');
  if (!name) return;
  await fetch(API + '/employees', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, sin_number, role, hourly_rate: parseFloat(hourly_rate) || 0, phone})
  });
  carregarDadosAba();
}

async function adicionarObra() {
  const client = prompt('Client / Cliente:');
  const address = prompt('Address / Endereço:');
  const start_date = prompt('Start Date / Data Início (YYYY-MM-DD):');
  const total_value_usd = prompt('Total Value USD / Valor Total USD:');
  if (!client) return;
  await fetch(API + '/projects', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client, address, start_date, total_value_usd: parseFloat(total_value_usd) || 0})
  });
  carregarDadosAba();
}

window.onload = () => carregarDadosAba();
