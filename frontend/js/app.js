const API = 'http://localhost:3000/api';
let ABA_ATUAL = 'dashboard';
let TAB_FINANCEIRO = 'fluxo';

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if(!res.ok) { console.error('Erro API:', url, res.status); return []; }
    const data = await res.json();
    return Array.isArray(data)? data : [];
  } catch(e) {
    console.error('Fetch error:', e);
    return [];
  }
}

function mostrarAba(aba) {
  document.querySelectorAll('.aba').forEach(function(el){ el.style.display = 'none'; });
  document.getElementById(aba).style.display = 'block';
  document.querySelectorAll('.menu-lateral li').forEach(function(el){ el.classList.remove('ativo'); });
  event.target.classList.add('ativo');
  ABA_ATUAL = aba;
  carregarDadosAba(aba);
}

function mostrarTabFinanceiro(tab) {
  TAB_FINANCEIRO = tab;
  document.querySelectorAll('.tab-financeiro').forEach(function(el){ el.style.display = 'none'; });
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(function(el){ el.classList.remove('ativo'); });
  event.target.classList.add('ativo');
  carregarTabFinanceiro(tab);
}

function abrirModal(id) { 
  document.getElementById(id).style.display = 'block';
  if(id === 'modalLancamento') carregarProjectsSelect();
}
function fecharModal(id) { document.getElementById(id).style.display = 'none'; }

function carregarDadosAba(aba) {
  if(aba === 'dashboard') carregarDashboard();
  if(aba === 'projects') carregarProjects();
  if(aba === 'employees') carregarEmployees();
  if(aba === 'financial') carregarTabFinanceiro(TAB_FINANCEIRO);
}

function carregarTabFinanceiro(tab) {
  if(tab === 'fluxo') carregarFluxoCaixa();
  if(tab === 'folha') carregarFolha();
  if(tab === 'contas') carregarContas();
  if(tab === 'comprovantes') carregarComprovantes();
}

async function carregarDashboard() {
  const projects = await safeFetch(API + '/projects');
  const employees = await safeFetch(API + '/employees');
  const financial = await safeFetch(API + '/financial');
  
  let totalIncome = 0, totalExpense = 0;
  financial.forEach(function(f){
    const val = Number(f.value_usd) || 0;
    if(f.type === 'Income / Receita') totalIncome += val;
    else totalExpense += val;
  });

  const avgRate = employees.length? employees.reduce(function(s,e){ return s + (Number(e.hourly_rate) || 0); }, 0) / employees.length : 0;

  document.getElementById('cards-dashboard').innerHTML = 
    '<div class="card"><h3>Active Projects <small>Obras Ativas</small></h3><div class="valor">' + projects.filter(function(o){ return o.status === 'In Progress'; }).length + '</div></div>' +
    '<div class="card"><h3>Employees <small>Funcionários</small></h3><div class="valor">' + employees.length + '</div></div>' +
    '<div class="card"><h3>Net Profit <small>Lucro</small></h3><div class="valor">\$' + (totalIncome - totalExpense).toFixed(2) + '</div></div>' +
    '<div class="card"><h3>Avg Hourly Rate <small>Média Hora</small></h3><div class="valor">\$' + avgRate.toFixed(2) + '</div></div>';
}

async function carregarFluxoCaixa() {
  const financial = await safeFetch(API + '/financial');
  
  let entrada = 0, saida = 0;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  
  financial.forEach(function(f){
    const val = Number(f.value_usd) || 0;
    const data = new Date(f.date);
    if(data.getMonth() === mesAtual) {
      if(f.type && f.type.includes('Income')) entrada += val;
      else saida += val;
    }
  });

  document.getElementById('cards-fluxo').innerHTML = 
    '<div class="card-fluxo entrada"><h4>Income / Entradas</h4><div class="valor">\$' + entrada.toFixed(2) + '</div></div>' +
    '<div class="card-fluxo saida"><h4>Expenses / Saídas</h4><div class="valor">\$' + saida.toFixed(2) + '</div></div>' +
    '<div class="card-fluxo saldo"><h4>Balance / Saldo</h4><div class="valor">\$' + (entrada - saida).toFixed(2) + '</div></div>';

  let html = '<table><tr><th>Date</th><th>Type</th><th>Description</th><th>Value</th><th>Project</th><th>Actions</th></tr>';
  if(financial.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No entries yet</td></tr>';
  } else {
    financial.slice(0, 50).forEach(function(f) {
      const val = Number(f.value_usd) || 0;
      const isIncome = f.type && f.type.includes('Income');
      html += '<tr><td>' + (f.date || '-') + '</td><td>' + (f.type || '-') + '</td><td>' + (f.description || '-') + 
              '</td><td style="color:' + (isIncome? '#10b981' : '#ef4444') + ';font-weight:600">' + 
              (isIncome? '+' : '-') + '\$' + val.toFixed(2) + '</td><td>' + (f.client || '-') + 
              '</td><td><button class="btn-excluir" onclick="excluirLancamento(' + f.id + ')">Del</button></td></tr>';
    });
  }
  html += '</table>';
  document.getElementById('lista-fluxo').innerHTML = html;
}

async function carregarFolha() {
  const employees = await safeFetch(API + '/employees');
  
  let totalFolha = 0;
  let html = '<table><tr><th>Employee</th><th>Role</th><th>Hours</th><th>Rate</th><th>Gross</th><th>Discounts</th><th>Net</th></tr>';
  
  if(employees.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No employees registered</td></tr>';
  } else {
    employees.forEach(function(f) {
      const rate = Number(f.hourly_rate) || 0;
      const horas = 160;
      const bruto = rate * horas;
      const desconto = bruto * 0.08;
      const liquido = bruto - desconto;
      totalFolha += liquido;
      
      html += '<tr><td>' + f.name + '</td><td>' + f.role.split(' / ')[0] + 
              '</td><td>' + horas + 'h</td><td>\$' + rate.toFixed(2) + 
              '</td><td>\$' + bruto.toFixed(2) + '</td><td style="color:#ef4444">-\$' + desconto.toFixed(2) + 
              '</td><td style="color:#10b981;font-weight:600">\$' + liquido.toFixed(2) + '</td></tr>';
    });
  }
  html += '</table>';
  
  document.getElementById('resumo-folha').innerHTML = 
    '<div class="card"><h3>Total Payroll <small>Folha Total</small></h3><div class="valor">\$' + totalFolha.toFixed(2) + '</div></div>';
  document.getElementById('lista-folha').innerHTML = html;
}

async function carregarContas() {
  const financial = await safeFetch(API + '/financial');
  
  let htmlPagar = '<table><tr><th>Due Date</th><th>Description</th><th>Value</th><th>Status</th></tr>';
  let htmlReceber = '<table><tr><th>Due Date</th><th>Client</th><th>Value</th><th>Status</th></tr>';
  
  let temPagar = false, temReceber = false;
  
  financial.forEach(function(f) {
    const val = Number(f.value_usd) || 0;
    if(f.type && f.type.includes('Expense')) {
      temPagar = true;
      htmlPagar += '<tr><td>' + (f.date || '-') + '</td><td>' + (f.description || '-') + 
                   '</td><td>\$' + val.toFixed(2) + '</td><td><span class="badge badge-pendente">Pending</span></td></tr>';
    }
    if(f.type && f.type.includes('Income')) {
      temReceber = true;
      htmlReceber += '<tr><td>' + (f.date || '-') + '</td><td>' + (f.client || '-') + 
                     '</td><td>\$' + val.toFixed(2) + '</td><td><span class="badge badge-pago">Received</span></td></tr>';
    }
  });
  
  if(!temPagar) htmlPagar += '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No payables</td></tr>';
  if(!temReceber) htmlReceber += '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No receivables</td></tr>';
  
  htmlPagar += '</table>';
  htmlReceber += '</table>';
  document.getElementById('lista-pagar').innerHTML = htmlPagar;
  document.getElementById('lista-receber').innerHTML = htmlReceber;
}

async function carregarComprovantes() {
  document.getElementById('lista-comprovantes').innerHTML = 
    '<table><tr><th>Date</th><th>Type</th><th>File</th><th>Value</th></tr>' +
    '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No receipts uploaded yet</td></tr></table>';
}

async function carregarProjectsSelect() {
  const projects = await safeFetch(API + '/projects');
  let html = '<option value="">General / Geral</option>';
  projects.forEach(function(p) {
    html += '<option value="' + p.client + '">' + p.client + '</option>';
  });
  document.getElementById('projectLancamento').innerHTML = html;
}

async function salvarLancamento() {
  const dados = {
    type: document.getElementById('tipoLancamento').value,
    description: document.getElementById('descLancamento').value,
    value_usd: document.getElementById('valorLancamento').value,
    client: document.getElementById('projectLancamento').value,
    date: document.getElementById('dataLancamento').value
  };
  await fetch(API + '/financial', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
  fecharModal('modalLancamento');
  carregarFluxoCaixa();
}

async function excluirLancamento(id) {
  if(confirm('Delete entry?')) {
    await fetch(API + '/financial/' + id, { method: 'DELETE' });
    carregarFluxoCaixa();
  }
}

function gerarFolha() {
  alert('Payroll generated! / Folha gerada! Check Payroll tab.');
  carregarFolha();
}

function getBadgeClass(role) {
  if(!role) return 'badge-other';
  if(role.includes('Foreman') || role.includes('Bricklayer') || role.includes('Helper') || role.includes('Carpenter') || role.includes('Electrician') || role.includes('Plumber') || role.includes('Welder') || role.includes('Operator') || role.includes('Engineer') || role.includes('Architect') || role.includes('Supervisor')) return 'badge-construction';
  if(role.includes('HR') || role.includes('Accountant') || role.includes('Finance') || role.includes('Office') || role.includes('Assistant')) return 'badge-admin';
  if(role.includes('IT') || role.includes('Systems') || role.includes('Developer') || role.includes('Support')) return 'badge-it';
  if(role.includes('Marketing') || role.includes('Sales') || role.includes('Social') || role.includes('Designer')) return 'badge-marketing';
  return 'badge-other';
}

function getInitials(name) {
  if(!name) return '??';
  const parts = name.trim().split(' ');
  if(parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0,2).toUpperCase();
}

async function carregarEmployees() {
  const employees = await safeFetch(API + '/employees');
  let html = '<table><tr><th>Name <small>Nome</small></th><th>Role <small>Função</small></th><th>SIN <small>SIN</small></th><th>Hourly Rate <small>Valor Hora</small></th><th>Phone <small>Telefone</small></th><th>Actions <small>Ações</small></th></tr>';
  if(employees.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No employees yet</td></tr>';
  } else {
    employees.forEach(function(f) {
      const rate = Number(f.hourly_rate) || 0;
      const badgeClass = getBadgeClass(f.role);
      const initials = getInitials(f.name);
      const roleShort = f.role? f.role.split(' / ')[0] : '-';
      
      html += '<tr>' +
              '<td><div class="employee-cell"><div class="avatar">' + initials + '</div><div>' + f.name + '</div></div></td>' +
              '<td><span class="badge ' + badgeClass + '">' + roleShort + '</span></td>' +
              '<td><span class="sin-text">' + (f.sin_number || '-') + '</span></td>' +
              '<td><span class="rate-text">\$' + rate.toFixed(2) + '/h</span></td>' +
              '<td>' + (f.phone || '-') + '</td>' +
              '<td><button class="btn-excluir" onclick="excluirEmployee(' + f.id + ')">Delete</button></td></tr>';
    });
  }
  html += '</table>';
  document.getElementById('lista-employees').innerHTML = html;
}

async function salvarEmployee() {
  const dados = {
    name: document.getElementById('nameEmployee').value,
    sin_number: document.getElementById('sinEmployee').value,
    phone: document.getElementById('phoneEmployee').value,
    role: document.getElementById('roleEmployee').value,
    hourly_rate: document.getElementById('rateEmployee').value || 0
  };
  await fetch(API + '/employees', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
  fecharModal('modalEmployee');
  carregarEmployees();
}

async function excluirEmployee(id) {
  if(confirm('Delete employee? / Excluir funcionário?')) {
    await fetch(API + '/employees/' + id, { method: 'DELETE' });
    carregarEmployees();
  }
}

async function carregarProjects() {
  const projects = await safeFetch(API + '/projects');
  let html = '<table><tr><th>ID</th><th>Client <small>Cliente</small></th><th>Status</th><th>Value USD <small>Valor USD</small></th></tr>';
  if(projects.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No projects yet</td></tr>';
  } else {
    projects.forEach(function(o) {
      const val = Number(o.total_value_usd) || 0;
      html += '<tr><td>' + o.id + '</td><td>' + o.client + '</td><td>' + o.status + '</td><td>\$' + val.toFixed(2) + '</td></tr>';
    });
  }
  html += '</table>';
  document.getElementById('lista-projects').innerHTML = html;
}

window.onload = function() { carregarDadosAba('dashboard'); };
