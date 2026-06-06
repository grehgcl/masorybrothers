const API = 'http://localhost:3000/api';
let abaAtual = 'dashboard';
let filtroProjetos = 'all';
let filtroQuotes = 'all';

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

function formatarMoeda(valor) {
  return '$' + Number(valor || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function mostrarAba(aba, btn) {
  abaAtual = aba;
  filtroProjetos = 'all';
  filtroQuotes = 'all';
  document.querySelectorAll('.menu-item').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  const titles = {
    dashboard: ['Dashboard', 'Painel Geral'],
    projects: ['Projects', 'Obras'],
    employees: ['Employees', 'Funcionários'],
    quotes: ['Quotes', 'Orçamentos'],
    daily: ['Daily Report', 'Diário de Obra'],
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
    const quotes = await safeFetch(API + '/quotes');
    
    const activeProjects = (projects || []).filter(p => p.status === 'In Progress').length;
    const totalEmployees = (employees || []).length;
    const pendingQuotes = (quotes || []).filter(q => q.status === 'Pending').length;
    const income = (financial || []).filter(f => f.type === 'Income').reduce((sum, f) => sum + (Number(f.value_usd) || 0), 0);
    const expense = (financial || []).filter(f => f.type === 'Expense').reduce((sum, f) => sum + (Number(f.value_usd) || 0), 0);
    const profit = income - expense;
    
    content.innerHTML = '<div class="cards">' +
      '<div class="card"><div class="card-title">ACTIVE PROJECTS</div><div class="card-subtitle">Obras Ativas</div><div class="card-value">' + activeProjects + '</div></div>' +
      '<div class="card"><div class="card-title">EMPLOYEES</div><div class="card-subtitle">Funcionários</div><div class="card-value">' + totalEmployees + '</div></div>' +
      '<div class="card"><div class="card-title">PENDING QUOTES</div><div class="card-subtitle">Orçamentos Pendentes</div><div class="card-value">' + pendingQuotes + '</div></div>' +
      '<div class="card"><div class="card-title">NET PROFIT</div><div class="card-subtitle">Lucro Líquido</div><div class="card-value">' + formatarMoeda(profit) + '</div></div>' +
      '</div>';
  }
  
  if (abaAtual === 'projects') {
    const data = await safeFetch(API + '/projects');
    let projetosFiltrados = data;
    if (filtroProjetos === 'active') projetosFiltrados = data.filter(p => p.status!== 'Completed');
    if (filtroProjetos === 'completed') projetosFiltrados = data.filter(p => p.status === 'Completed');
    
    let html = '<button class="btn" onclick="abrirModalProjeto()">Add Project / Adicionar Obra</button>';
    html += '<div class="filter-tabs">';
    html += '<button class="filter-tab ' + (filtroProjetos==='all'?'active':'') + '" onclick="filtrarProjetos(\'all\')">All / Todos</button>';
    html += '<button class="filter-tab ' + (filtroProjetos==='active'?'active':'') + '" onclick="filtrarProjetos(\'active\')">Active / Ativos</button>';
    html += '<button class="filter-tab ' + (filtroProjetos==='completed'?'active':'') + '" onclick="filtrarProjetos(\'completed\')">Completed / Concluídos</button>';
    html += '</div>';
    html += '<table><tr><th>Client<br><small>Cliente</small></th><th>Address<br><small>Endereço</small></th><th>Start Date<br><small>Data Início</small></th><th>Status<br><small>Status</small></th><th>Value USD<br><small>Valor USD</small></th><th>Actions<br><small>Ações</small></th></tr>';
    projetosFiltrados.forEach(p => {
      const statusClass = p.status === 'Completed'? 'status-completed' : p.status === 'In Progress'? 'status-progress' : 'status-pending';
      html += '<tr>' +
        '<td>' + (p.client || '') + '</td>' +
        '<td>' + (p.address || '') + '</td>' +
        '<td>' + (p.start_date || '') + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + (p.status || '') + '</span></td>' +
        '<td>' + formatarMoeda(p.total_value_usd) + '</td>' +
        '<td>' +
        '<button class="btn btn-sm btn-blue" onclick="verDetalhes(' + p.id + ')">View</button>' +
        '<button class="btn btn-sm btn-gray" onclick="editarProjeto(' + p.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-red" onclick="apagarProjeto(' + p.id + ')">Delete</button>' +
        (p.status!== 'Completed'? '<button class="btn btn-sm btn-green" onclick="concluirProjeto(' + p.id + ')">Complete</button>' : '') +
        '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'quotes') {
    const data = await safeFetch(API + '/quotes');
    let quotesFiltrados = data;
    if (filtroQuotes === 'pending') quotesFiltrados = data.filter(q => q.status === 'Pending');
    if (filtroQuotes === 'approved') quotesFiltrados = data.filter(q => q.status === 'Approved');
    if (filtroQuotes === 'rejected') quotesFiltrados = data.filter(q => q.status === 'Rejected');
    
    let html = '<button class="btn" onclick="abrirModalQuote()">Add Quote / Adicionar Orçamento</button>';
    html += '<div class="filter-tabs">';
    html += '<button class="filter-tab ' + (filtroQuotes==='all'?'active':'') + '" onclick="filtrarQuotes(\'all\')">All / Todos</button>';
    html += '<button class="filter-tab ' + (filtroQuotes==='pending'?'active':'') + '" onclick="filtrarQuotes(\'pending\')">Pending / Pendentes</button>';
    html += '<button class="filter-tab ' + (filtroQuotes==='approved'?'active':'') + '" onclick="filtrarQuotes(\'approved\')">Approved / Aprovados</button>';
    html += '<button class="filter-tab ' + (filtroQuotes==='rejected'?'active':'') + '" onclick="filtrarQuotes(\'rejected\')">Rejected / Rejeitados</button>';
    html += '</div>';
    html += '<table><tr><th>Client<br><small>Cliente</small></th><th>Address<br><small>Endereço</small></th><th>Date<br><small>Data</small></th><th>Value USD<br><small>Valor USD</small></th><th>Status<br><small>Status</small></th><th>Actions<br><small>Ações</small></th></tr>';
    quotesFiltrados.forEach(q => {
      const statusClass = q.status === 'Approved'? 'status-approved' : q.status === 'Rejected'? 'status-rejected' : 'status-pending';
      html += '<tr>' +
        '<td>' + (q.client || '') + '</td>' +
        '<td>' + (q.address || '') + '</td>' +
        '<td>' + (q.date || '') + '</td>' +
        '<td>' + formatarMoeda(q.total_value_usd) + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + (q.status || '') + '</span></td>' +
        '<td>' +
        '<button class="btn btn-sm btn-gray" onclick="editarQuote(' + q.id + ')">Edit</button>' +
        (q.status === 'Pending'? '<button class="btn btn-sm btn-green" onclick="aprovarQuote(' + q.id + ')">Approve</button>' : '') +
        (q.status === 'Pending'? '<button class="btn btn-sm btn-orange" onclick="rejeitarQuote(' + q.id + ')">Reject</button>' : '') +
        '<button class="btn btn-sm btn-red" onclick="apagarQuote(' + q.id + ')">Delete</button>' +
        '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'daily') {
    const data = await safeFetch(API + '/daily');
    let html = '<button class="btn" onclick="abrirModalDaily()">Add Daily Report / Adicionar Diário</button>';
    html += '<table><tr><th>Date<br><small>Data</small></th><th>Project<br><small>Obra</small></th><th>Employee<br><small>Funcionário</small></th><th>Hours<br><small>Horas</small></th><th>Description<br><small>Descrição</small></th><th>Weather<br><small>Clima</small></th><th>Actions<br><small>Ações</small></th></tr>';
    data.forEach(d => {
      html += '<tr>' +
        '<td>' + (d.date || '') + '</td>' +
        '<td>' + (d.project_name || '') + '</td>' +
        '<td>' + (d.employee_name || '') + '</td>' +
        '<td>' + (d.hours || 0) + 'h</td>' +
        '<td>' + (d.description || '') + '</td>' +
        '<td>' + (d.weather || '') + '</td>' +
        '<td>' +
        '<button class="btn btn-sm btn-gray" onclick="editarDaily(' + d.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-red" onclick="apagarDaily(' + d.id + ')">Delete</button>' +
        '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'materials') {
    const data = await safeFetch(API + '/materials');
    let html = '<button class="btn" onclick="abrirModalMaterial()">Add Material / Adicionar Material</button>';
    html += '<table><tr><th>Name<br><small>Nome</small></th><th>Unit<br><small>Unidade</small></th><th>Quantity<br><small>Qtd</small></th><th>Price USD<br><small>Preço USD</small></th><th>Total<br><small>Total</small></th><th>Supplier<br><small>Fornecedor</small></th><th>Project<br><small>Obra</small></th><th>Actions<br><small>Ações</small></th></tr>';
    data.forEach(m => {
      const total = (m.quantity || 0) * (m.price_usd || 0);
      html += '<tr>' +
        '<td>' + (m.name || '') + '</td>' +
        '<td>' + (m.unit || '') + '</td>' +
        '<td>' + (m.quantity || 0) + '</td>' +
        '<td>' + formatarMoeda(m.price_usd) + '</td>' +
        '<td>' + formatarMoeda(total) + '</td>' +
        '<td>' + (m.supplier || '') + '</td>' +
        '<td>' + (m.project_name || 'Stock') + '</td>' +
        '<td>' +
        '<button class="btn btn-sm btn-gray" onclick="editarMaterial(' + m.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-red" onclick="apagarMaterial(' + m.id + ')">Delete</button>' +
        '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'tools') {
    const data = await safeFetch(API + '/tools');
    let html = '<button class="btn" onclick="abrirModalTool()">Add Tool / Adicionar Ferramenta</button>';
    html += '<table><tr><th>Name<br><small>Nome</small></th><th>Brand<br><small>Marca</small></th><th>Serial<br><small>Série</small></th><th>Status<br><small>Status</small></th><th>Location<br><small>Local</small></th><th>Employee<br><small>Funcionário</small></th><th>Actions<br><small>Ações</small></th></tr>';
    data.forEach(t => {
      const statusClass = t.status === 'Available'? 'status-available' : t.status === 'In Use'? 'status-in-use' : 'status-maintenance';
      html += '<tr>' +
        '<td>' + (t.name || '') + '</td>' +
        '<td>' + (t.brand || '') + '</td>' +
        '<td>' + (t.serial_number || '') + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + (t.status || '') + '</span></td>' +
        '<td>' + (t.location || '') + '</td>' +
        '<td>' + (t.employee_name || '-') + '</td>' +
        '<td>' +
        '<button class="btn btn-sm btn-gray" onclick="editarTool(' + t.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-red" onclick="apagarTool(' + t.id + ')">Delete</button>' +
        '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'financial') {
    const data = await safeFetch(API + '/financial');
    let html = '<button class="btn" onclick="adicionarLancamento()">Add Entry / Adicionar Lançamento</button>';
    html += '<table><tr><th>Date<br><small>Data</small></th><th>Type<br><small>Tipo</small></th><th>Description<br><small>Descrição</small></th><th>Value USD<br><small>Valor USD</small></th><th>Category<br><small>Categoria</small></th><th>Actions<br><small>Ações</small></th></tr>';
    data.forEach(f => {
      html += '<tr><td>' + (f.date || '') + '</td><td>' + (f.type || '') + '</td><td>' + (f.description || '') + '</td><td>' + formatarMoeda(f.value_usd) + '</td><td>' + (f.category || '') + '</td>';
      html += '<td>' + (f.project_id? '<button class="btn btn-sm btn-blue" onclick="verDetalhes(' + f.project_id + ')">View Project</button>' : '-') + '</td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
  
  if (abaAtual === 'employees') {
    const data = await safeFetch(API + '/employees');
    let html = '<button class="btn" onclick="abrirModalEmployee()">Add Employee / Adicionar Funcionário</button>';
    html += '<table><tr><th>Name<br><small>Nome</small></th><th>SIN<br><small>SIN</small></th><th>Role<br><small>Cargo</small></th><th>Hourly Rate<br><small>Valor Hora</small></th><th>Phone<br><small>Telefone</small></th><th>Actions<br><small>Ações</small></th></tr>';
    data.forEach(e => {
      html += '<tr><td>' + (e.name || '') + '</td><td>' + (e.sin_number || '') + '</td><td>' + (e.role || '') + '</td><td>' + formatarMoeda(e.hourly_rate) + '</td><td>' + (e.phone || '') + '</td>' +
        '<td><button class="btn btn-sm btn-gray" onclick="editarEmployee(' + e.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-red" onclick="apagarEmployee(' + e.id + ')">Delete</button></td></tr>';
    });
    html += '</table>';
    content.innerHTML = html;
  }
}

function filtrarProjetos(filtro) { filtroProjetos = filtro; carregarDadosAba(); }
function filtrarQuotes(filtro) { filtroQuotes = filtro; carregarDadosAba(); }

function abrirModalProjeto() {
  document.getElementById('modalTitle').textContent = 'Add Project / Adicionar Obra';
  document.getElementById('projectId').value = '';
  document.getElementById('projectClient').value = '';
  document.getElementById('projectAddress').value = '';
  document.getElementById('projectStartDate').value = '';
  document.getElementById('projectValue').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectStatus').value = 'Pending';
  document.getElementById('modalProject').style.display = 'block';
}

async function editarProjeto(id) {
  const projects = await safeFetch(API + '/projects');
  const p = projects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitle').textContent = 'Edit Project / Editar Obra';
  document.getElementById('projectId').value = p.id;
  document.getElementById('projectClient').value = p.client || '';
  document.getElementById('projectAddress').value = p.address || '';
  document.getElementById('projectStartDate').value = p.start_date || '';
  document.getElementById('projectValue').value = p.total_value_usd || '';
  document.getElementById('projectDescription').value = p.description || '';
  document.getElementById('projectStatus').value = p.status || 'Pending';
  document.getElementById('modalProject').style.display = 'block';
}

function abrirModalEmployee() {
  document.getElementById('modalEmployeeTitle').textContent = 'Add Employee / Adicionar Funcionário';
  document.getElementById('employeeId').value = '';
  document.getElementById('employeeName').value = '';
  document.getElementById('employeeSin').value = '';
  document.getElementById('employeeRole').value = '';
  document.getElementById('employeeRate').value = '';
  document.getElementById('employeePhone').value = '';
  document.getElementById('modalEmployee').style.display = 'block';
}

async function editarEmployee(id) {
  const employees = await safeFetch(API + '/employees');
  const e = employees.find(x => x.id === id);
  if (!e) return;
  document.getElementById('modalEmployeeTitle').textContent = 'Edit Employee / Editar Funcionário';
  document.getElementById('employeeId').value = e.id;
  document.getElementById('employeeName').value = e.name || '';
  document.getElementById('employeeSin').value = e.sin_number || '';
  document.getElementById('employeeRole').value = e.role || '';
  document.getElementById('employeeRate').value = e.hourly_rate || '';
  document.getElementById('employeePhone').value = e.phone || '';
  document.getElementById('modalEmployee').style.display = 'block';
}

function abrirModalQuote() {
  document.getElementById('modalQuoteTitle').textContent = 'Add Quote / Adicionar Orçamento';
  document.getElementById('quoteId').value = '';
  document.getElementById('quoteClient').value = '';
  document.getElementById('quoteAddress').value = '';
  document.getElementById('quoteDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('quoteValue').value = '';
  document.getElementById('quoteDescription').value = '';
  document.getElementById('quoteStatus').value = 'Pending';
  document.getElementById('modalQuote').style.display = 'block';
}

async function editarQuote(id) {
  const quotes = await safeFetch(API + '/quotes');
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  document.getElementById('modalQuoteTitle').textContent = 'Edit Quote / Editar Orçamento';
  document.getElementById('quoteId').value = q.id;
  document.getElementById('quoteClient').value = q.client || '';
  document.getElementById('quoteAddress').value = q.address || '';
  document.getElementById('quoteDate').value = q.date || '';
  document.getElementById('quoteValue').value = q.total_value_usd || '';
  document.getElementById('quoteDescription').value = q.description || '';
  document.getElementById('quoteStatus').value = q.status || 'Pending';
  document.getElementById('modalQuote').style.display = 'block';
}

async function abrirModalDaily() {
  document.getElementById('modalDailyTitle').textContent = 'Add Daily Report / Adicionar Diário';
  document.getElementById('dailyId').value = '';
  document.getElementById('dailyDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('dailyHours').value = '8';
  document.getElementById('dailyDescription').value = '';
  document.getElementById('dailyWeather').value = '';
  
  const projects = await safeFetch(API + '/projects');
  const employees = await safeFetch(API + '/employees');
  document.getElementById('dailyProject').innerHTML = projects.map(p => '<option value="' + p.id + '">' + p.client + ' - ' + p.address + '</option>').join('');
  document.getElementById('dailyEmployee').innerHTML = employees.map(e => '<option value="' + e.id + '">' + e.name + '</option>').join('');
  document.getElementById('modalDaily').style.display = 'block';
}

async function editarDaily(id) {
  const dailies = await safeFetch(API + '/daily');
  const d = dailies.find(x => x.id === id);
  if (!d) return;
  document.getElementById('modalDailyTitle').textContent = 'Edit Daily Report / Editar Diário';
  document.getElementById('dailyId').value = d.id;
  document.getElementById('dailyDate').value = d.date || '';
  document.getElementById('dailyHours').value = d.hours || '';
  document.getElementById('dailyDescription').value = d.description || '';
  document.getElementById('dailyWeather').value = d.weather || '';
  
  const projects = await safeFetch(API + '/projects');
  const employees = await safeFetch(API + '/employees');
  document.getElementById('dailyProject').innerHTML = projects.map(p => '<option value="' + p.id + '"' + (p.id === d.project_id? ' selected' : '') + '>' + p.client + ' - ' + p.address + '</option>').join('');
  document.getElementById('dailyEmployee').innerHTML = employees.map(e => '<option value="' + e.id + '"' + (e.id === d.employee_id? ' selected' : '') + '>' + e.name + '</option>').join('');
  document.getElementById('modalDaily').style.display = 'block';
}

async function abrirModalMaterial() {
  document.getElementById('modalMaterialTitle').textContent = 'Add Material / Adicionar Material';
  document.getElementById('materialId').value = '';
  document.getElementById('materialName').value = '';
  document.getElementById('materialUnit').value = '';
  document.getElementById('materialQuantity').value = '';
  document.getElementById('materialPrice').value = '';
  document.getElementById('materialSupplier').value = '';
  
  const projects = await safeFetch(API + '/projects');
  document.getElementById('materialProject').innerHTML = '<option value="">None / Nenhuma</option>' + projects.map(p => '<option value="' + p.id + '">' + p.client + '</option>').join('');
  document.getElementById('modalMaterial').style.display = 'block';
}

async function editarMaterial(id) {
  const materials = await safeFetch(API + '/materials');
  const m = materials.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modalMaterialTitle').textContent = 'Edit Material / Editar Material';
  document.getElementById('materialId').value = m.id;
  document.getElementById('materialName').value = m.name || '';
  document.getElementById('materialUnit').value = m.unit || '';
  document.getElementById('materialQuantity').value = m.quantity || '';
  document.getElementById('materialPrice').value = m.price_usd || '';
  document.getElementById('materialSupplier').value = m.supplier || '';
  
  const projects = await safeFetch(API + '/projects');
  document.getElementById('materialProject').innerHTML = '<option value="">None / Nenhuma</option>' + projects.map(p => '<option value="' + p.id + '"' + (p.id === m.project_id? ' selected' : '') + '>' + p.client + '</option>').join('');
  document.getElementById('modalMaterial').style.display = 'block';
}

async function abrirModalTool() {
  document.getElementById('modalToolTitle').textContent = 'Add Tool / Adicionar Ferramenta';
  document.getElementById('toolId').value = '';
  document.getElementById('toolName').value = '';
  document.getElementById('toolBrand').value = '';
  document.getElementById('toolSerial').value = '';
  document.getElementById('toolStatus').value = 'Available';
  document.getElementById('toolLocation').value = '';
  
  const employees = await safeFetch(API + '/employees');
  document.getElementById('toolEmployee').innerHTML = '<option value="">None / Nenhum</option>' + employees.map(e => '<option value="' + e.id + '">' + e.name + '</option>').join('');
  document.getElementById('modalTool').style.display = 'block';
}

async function editarTool(id) {
  const tools = await safeFetch(API + '/tools');
  const t = tools.find(x => x.id === id);
  if (!t) return;
  document.getElementById('modalToolTitle').textContent = 'Edit Tool / Editar Ferramenta';
  document.getElementById('toolId').value = t.id;
  document.getElementById('toolName').value = t.name || '';
  document.getElementById('toolBrand').value = t.brand || '';
  document.getElementById('toolSerial').value = t.serial_number || '';
  document.getElementById('toolStatus').value = t.status || 'Available';
  document.getElementById('toolLocation').value = t.location || '';
  
  const employees = await safeFetch(API + '/employees');
  document.getElementById('toolEmployee').innerHTML = '<option value="">None / Nenhum</option>' + employees.map(e => '<option value="' + e.id + '"' + (e.id === t.employee_id? ' selected' : '') + '>' + e.name + '</option>').join('');
  document.getElementById('modalTool').style.display = 'block';
}

async function verDetalhes(id) {
  const p = await safeFetch(API + '/projects/' + id);
  if (!p) { alert('Project not found / Projeto não encontrado'); return; }
  const html = '<div class="detail-row"><div class="detail-label">Client:</div><div class="detail-value">' + (p.client || '') + '</div></div>' +
    '<div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">' + (p.address || '') + '</div></div>' +
    '<div class="detail-row"><div class="detail-label">Start Date:</div><div class="detail-value">' + (p.start_date || '') + '</div></div>' +
    '<div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value">' + (p.status || '') + '</div></div>' +
    '<div class="detail-row"><div class="detail-label">Value USD:</div><div class="detail-value">' + formatarMoeda(p.total_value_usd) + '</div></div>' +
    '<div class="detail-row"><div class="detail-label">Description:</div><div class="detail-value">' + (p.description || 'N/A') + '</div></div>';
  document.getElementById('detailsContent').innerHTML = html;
  document.getElementById('modalDetails').style.display = 'block';
}

function fecharModal() { document.getElementById('modalProject').style.display = 'none'; }
function fecharModalEmployee() { document.getElementById('modalEmployee').style.display = 'none'; }
function fecharModalQuote() { document.getElementById('modalQuote').style.display = 'none'; }
function fecharModalDaily() { document.getElementById('modalDaily').style.display = 'none'; }
function fecharModalMaterial() { document.getElementById('modalMaterial').style.display = 'none'; }
function fecharModalTool() { document.getElementById('modalTool').style.display = 'none'; }
function fecharModalDetails() { document.getElementById('modalDetails').style.display = 'none'; }

async function salvarProjeto() {
  const id = document.getElementById('projectId').value;
  const client = document.getElementById('projectClient').value.trim();
  const address = document.getElementById('projectAddress').value.trim();
  const start_date = document.getElementById('projectStartDate').value;
  let valueStr = document.getElementById('projectValue').value.trim();
  valueStr = valueStr.replace(',', '.');
  const total_value_usd = parseFloat(valueStr);
  const description = document.getElementById('projectDescription').value.trim();
  const status = document.getElementById('projectStatus').value;
  
  if (!client) { alert('Client is required / Cliente é obrigatório'); return; }
  if (!address) { alert('Address is required / Endereço é obrigatório'); return; }
  if (!start_date) { alert('Start Date is required / Data é obrigatória'); return; }
  if (!valueStr || isNaN(total_value_usd) || total_value_usd <= 0) { alert('Value must be a number greater than 0 / Valor deve ser um número maior que 0'); return; }
  
  const data = {client, address, start_date, total_value_usd, description, status};
  const url = id? API + '/projects/' + id : API + '/projects';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModal();
  carregarDadosAba();
}

async function salvarEmployee() {
  const id = document.getElementById('employeeId').value;
  const name = document.getElementById('employeeName').value.trim();
  const sin_number = document.getElementById('employeeSin').value.trim();
  const role = document.getElementById('employeeRole').value.trim();
  let rateStr = document.getElementById('employeeRate').value.trim();
  rateStr = rateStr.replace(',', '.');
  const hourly_rate = parseFloat(rateStr);
  const phone = document.getElementById('employeePhone').value.trim();
  
  if (!name) { alert('Name is required / Nome é obrigatório'); return; }
  if (!role) { alert('Role is required / Cargo é obrigatório'); return; }
  if (!rateStr || isNaN(hourly_rate) || hourly_rate <= 0) { alert('Hourly rate must be greater than 0 / Valor hora deve ser maior que 0'); return; }
  
  const data = {name, sin_number, role, hourly_rate, phone};
  const url = id? API + '/employees/' + id : API + '/employees';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModalEmployee();
  carregarDadosAba();
}

async function salvarQuote() {
  const id = document.getElementById('quoteId').value;
  const client = document.getElementById('quoteClient').value.trim();
  const address = document.getElementById('quoteAddress').value.trim();
  const date = document.getElementById('quoteDate').value;
  let valueStr = document.getElementById('quoteValue').value.trim();
  valueStr = valueStr.replace(',', '.');
  const total_value_usd = parseFloat(valueStr);
  const description = document.getElementById('quoteDescription').value.trim();
  const status = document.getElementById('quoteStatus').value;
  
  if (!client) { alert('Client is required / Cliente é obrigatório'); return; }
  if (!address) { alert('Address is required / Endereço é obrigatório'); return; }
    if (!date) { alert('Date is required / Data é obrigatória'); return; }
  if (!valueStr || isNaN(total_value_usd) || total_value_usd <= 0) { 
    alert('Value must be a number greater than 0 / Valor deve ser um número maior que 0'); 
    return; 
  }
  
  const data = {client, address, date, total_value_usd, description, status};
  const url = id? API + '/quotes/' + id : API + '/quotes';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModalQuote();
  carregarDadosAba();
}

async function salvarDaily() {
  const id = document.getElementById('dailyId').value;
  const project_id = document.getElementById('dailyProject').value;
  const date = document.getElementById('dailyDate').value;
  const employee_id = document.getElementById('dailyEmployee').value;
  const hours = parseFloat(document.getElementById('dailyHours').value);
  const description = document.getElementById('dailyDescription').value.trim();
  const weather = document.getElementById('dailyWeather').value;
  
  if (!project_id) { alert('Project is required / Obra é obrigatória'); return; }
  if (!date) { alert('Date is required / Data é obrigatória'); return; }
  if (!employee_id) { alert('Employee is required / Funcionário é obrigatório'); return; }
  if (isNaN(hours) || hours <= 0) { alert('Hours must be greater than 0 / Horas deve ser maior que 0'); return; }
  
  const data = {project_id, date, employee_id, hours, description, weather};
  const url = id? API + '/daily/' + id : API + '/daily';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModalDaily();
  carregarDadosAba();
}

async function salvarMaterial() {
  const id = document.getElementById('materialId').value;
  const name = document.getElementById('materialName').value.trim();
  const unit = document.getElementById('materialUnit').value.trim();
  const quantity = parseFloat(document.getElementById('materialQuantity').value);
  const price_usd = parseFloat(document.getElementById('materialPrice').value);
  const supplier = document.getElementById('materialSupplier').value.trim();
  const project_id = document.getElementById('materialProject').value || null;
  
  if (!name) { alert('Name is required / Nome é obrigatório'); return; }
  if (!unit) { alert('Unit is required / Unidade é obrigatória'); return; }
  if (isNaN(quantity) || quantity <= 0) { alert('Quantity must be greater than 0 / Quantidade deve ser maior que 0'); return; }
  if (isNaN(price_usd) || price_usd <= 0) { alert('Price must be greater than 0 / Preço deve ser maior que 0'); return; }
  
  const data = {name, unit, quantity, price_usd, supplier, project_id};
  const url = id? API + '/materials/' + id : API + '/materials';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModalMaterial();
  carregarDadosAba();
}

async function salvarTool() {
  const id = document.getElementById('toolId').value;
  const name = document.getElementById('toolName').value.trim();
  const brand = document.getElementById('toolBrand').value.trim();
  const serial_number = document.getElementById('toolSerial').value.trim();
  const status = document.getElementById('toolStatus').value;
  const location = document.getElementById('toolLocation').value.trim();
  const employee_id = document.getElementById('toolEmployee').value || null;
  
  if (!name) { alert('Name is required / Nome é obrigatório'); return; }
  
  const data = {name, brand, serial_number, status, location, employee_id};
  const url = id? API + '/tools/' + id : API + '/tools';
  const method = id? 'PUT' : 'POST';
  await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  fecharModalTool();
  carregarDadosAba();
}

async function aprovarQuote(id) {
  if (!confirm('Approve this quote and create project? / Aprovar orçamento e criar obra?')) return;
  const quotes = await safeFetch(API + '/quotes');
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  
  await fetch(API + '/quotes/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ status: 'Approved' })
  });
  
  await fetch(API + '/projects', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      client: q.client,
      address: q.address,
      start_date: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      total_value_usd: q.total_value_usd,
      description: q.description
    })
  });
  carregarDadosAba();
}

async function rejeitarQuote(id) {
  if (!confirm('Reject this quote? / Rejeitar este orçamento?')) return;
  await fetch(API + '/quotes/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ status: 'Rejected' })
  });
  carregarDadosAba();
}

async function apagarProjeto(id) {
  if (!confirm('Delete this project? / Apagar esta obra?')) return;
  await fetch(API + '/projects/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function apagarEmployee(id) {
  if (!confirm('Delete this employee? / Apagar este funcionário?')) return;
  await fetch(API + '/employees/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function apagarQuote(id) {
  if (!confirm('Delete this quote? / Apagar este orçamento?')) return;
  await fetch(API + '/quotes/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function apagarDaily(id) {
  if (!confirm('Delete this daily report? / Apagar este diário?')) return;
  await fetch(API + '/daily/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function apagarMaterial(id) {
  if (!confirm('Delete this material? / Apagar este material?')) return;
  await fetch(API + '/materials/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function apagarTool(id) {
  if (!confirm('Delete this tool? / Apagar esta ferramenta?')) return;
  await fetch(API + '/tools/' + id, { method: 'DELETE' });
  carregarDadosAba();
}

async function concluirProjeto(id) {
  if (!confirm('Mark as completed? This will add to Financial / Marcar como concluído? Isso vai adicionar ao Financeiro')) return;
  const p = await safeFetch(API + '/projects/' + id);
  if (!p) return;
  await fetch(API + '/projects/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ status: 'Completed' })
  });
  await fetch(API + '/financial', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      description: 'Project Completed: ' + p.client,
      value_usd: p.total_value_usd,
      category: 'Project Revenue',
      project_id: id
    })
  });
  carregarDadosAba();
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

window.onclick = function(event) {
  const modals = ['modalProject','modalDetails','modalEmployee','modalQuote','modalDaily','modalMaterial','modalTool'];
  modals.forEach(m => {
    const modal = document.getElementById(m);
    if (event.target == modal) modal.style.display = 'none';
  });
}

window.onload = () => carregarDadosAba();
