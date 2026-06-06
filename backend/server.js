const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

const fs = require('fs');
if (!fs.existsSync('./database')) fs.mkdirSync('./database');
const db = new sqlite3.Database("./database/sistema.db");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS funcionarios (id INTEGER PRIMARY KEY, name TEXT, sin_number TEXT, role TEXT, hourly_rate REAL DEFAULT 0, phone TEXT, active INTEGER DEFAULT 1)");
  db.run("CREATE TABLE IF NOT EXISTS financeiro (id INTEGER PRIMARY KEY, date TEXT, type TEXT, description TEXT, value_usd REAL DEFAULT 0, project_id INTEGER, category TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS obras (id INTEGER PRIMARY KEY, client TEXT, address TEXT, start_date TEXT, end_date TEXT, status TEXT, total_value_usd REAL DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS servicos (id INTEGER PRIMARY KEY, name TEXT, unit TEXT, unit_price_usd REAL DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS materiais (id INTEGER PRIMARY KEY, name TEXT, unit TEXT, unit_price_usd REAL DEFAULT 0, stock REAL DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS ferramentas (id INTEGER PRIMARY KEY, name TEXT, code TEXT, status TEXT, project_id INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS agenda (id INTEGER PRIMARY KEY, date TEXT, time TEXT, project_id INTEGER, description TEXT, status TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, source TEXT, status TEXT, notes TEXT, date TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS campanhas (id INTEGER PRIMARY KEY, name TEXT, channel TEXT, budget_usd REAL DEFAULT 0, start_date TEXT, end_date TEXT, result TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS documentos (id INTEGER PRIMARY KEY, type TEXT, name TEXT, file TEXT, expiry_date TEXT, project_id INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, name TEXT, login TEXT, password TEXT, level TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS timesheet (id INTEGER PRIMARY KEY, date TEXT, employee_id INTEGER, project_id INTEGER, hours REAL DEFAULT 0, approved INTEGER DEFAULT 0)");
});

app.get("/api/employees", (req, res) => {
  db.all("SELECT * FROM funcionarios WHERE active = 1", (err, rows) => {
    if(err) { console.error('ERRO /api/employees:', err.message); return res.status(500).json({error: err.message}); }
    res.json(rows);
  });
});

app.post("/api/employees", (req, res) => {
  const { name, sin_number, role, hourly_rate, phone } = req.body;
  db.run("INSERT INTO funcionarios (name, sin_number, role, hourly_rate, phone) VALUES (?,?,?,?,?)", 
    [name, sin_number, role, hourly_rate || 0, phone], function(err) {
    if(err) { console.error('ERRO POST /api/employees:', err.message); return res.status(500).json({error: err.message}); }
    res.json({ id: this.lastID, msg: "Employee created!" });
  });
});

app.delete("/api/employees/:id", (req, res) => {
  db.run("UPDATE funcionarios SET active = 0 WHERE id = ?", [req.params.id], (err) => {
    if(err) { console.error('ERRO DELETE /api/employees:', err.message); return res.status(500).json({error: err.message}); }
    res.json({msg: "Deleted"});
  });
});

app.get("/api/financial", (req, res) => {
  db.all("SELECT * FROM financeiro ORDER BY date DESC", (err, rows) => {
    if(err) { console.error('ERRO /api/financial:', err.message); return res.status(500).json({error: err.message}); }
    res.json(rows);
  });
});

app.post("/api/financial", (req, res) => {
  const { date, type, description, value_usd, project_id, category } = req.body;
  db.run("INSERT INTO financeiro (date, type, description, value_usd, project_id, category) VALUES (?,?,?,?,?,?)", 
    [date, type, description, value_usd || 0, project_id, category], function(err) {
    if(err) { console.error('ERRO POST /api/financial:', err.message); return res.status(500).json({error: err.message}); }
    res.json({ id: this.lastID, msg: "Entry saved!" });
  });
});

app.get("/api/projects", (req, res) => { 
  db.all("SELECT * FROM obras ORDER BY id DESC", (err, rows) => {
    if(err) { console.error('ERRO /api/projects:', err.message); return res.status(500).json({error: err.message}); }
    res.json(rows);
  }); 
});

app.post("/api/projects", (req, res) => {
  const { client, address, start_date, total_value_usd } = req.body;
  db.run("INSERT INTO obras (client, address, start_date, status, total_value_usd) VALUES (?,?,?,?,?)", 
    [client, address, start_date, "In Progress", total_value_usd || 0], function(err) {
    if(err) { console.error('ERRO POST /api/projects:', err.message); return res.status(500).json({error: err.message}); }
    res.json({ id: this.lastID, msg: "Project created!" });
  });
});

app.get("/api/services", (req, res) => { db.all("SELECT * FROM servicos", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/materials", (req, res) => { db.all("SELECT * FROM materiais", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/tools", (req, res) => { db.all("SELECT * FROM ferramentas", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/schedule", (req, res) => { db.all("SELECT * FROM agenda ORDER BY date, time", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/leads", (req, res) => { db.all("SELECT * FROM leads ORDER BY id DESC", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/campaigns", (req, res) => { db.all("SELECT * FROM campanhas ORDER BY id DESC", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/documents", (req, res) => { db.all("SELECT * FROM documentos", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });
app.get("/api/users", (req, res) => { db.all("SELECT id, name, login, level FROM usuarios", (err, rows) => { if(err) console.error(err); res.json(rows || []); }); });

app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
