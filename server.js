const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
const db = new Database('brothers_masory.db');

db.exec('CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,client TEXT,address TEXT,start_date TEXT,status TEXT,total_value_usd REAL,description TEXT);CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY,name TEXT,sin_number TEXT,role TEXT,hourly_rate REAL,phone TEXT);CREATE TABLE IF NOT EXISTS financial(id INTEGER PRIMARY KEY,date TEXT,type TEXT,description TEXT,value_usd REAL,category TEXT,project_id INTEGER);CREATE TABLE IF NOT EXISTS quotes(id INTEGER PRIMARY KEY,client TEXT,address TEXT,date TEXT,total_value_usd REAL,description TEXT,status TEXT);CREATE TABLE IF NOT EXISTS daily_reports(id INTEGER PRIMARY KEY,project_id INTEGER,date TEXT,employee_id INTEGER,hours REAL,description TEXT,weather TEXT);CREATE TABLE IF NOT EXISTS materials(id INTEGER PRIMARY KEY,name TEXT,unit TEXT,quantity REAL,price_usd REAL,supplier TEXT,project_id INTEGER);CREATE TABLE IF NOT EXISTS tools(id INTEGER PRIMARY KEY,name TEXT,brand TEXT,serial_number TEXT,status TEXT,location TEXT,employee_id INTEGER);');

try { db.exec('ALTER TABLE projects ADD COLUMN description TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE financial ADD COLUMN project_id INTEGER'); } catch(e) {}

app.get('/api/projects',(req,res)=>{
  const rows=db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/projects',(req,res)=>{
  const{client,address,start_date,status,total_value_usd,description}=req.body;
  const stmt=db.prepare('INSERT INTO projects(client,address,start_date,status,total_value_usd,description)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(client,address,start_date,status,total_value_usd,description);
  res.json({id:result.lastInsertRowid});
});
app.put('/api/projects/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{client,address,start_date,status,total_value_usd,description}=req.body;
  const stmt=db.prepare('UPDATE projects SET client=?,address=?,start_date=?,status=?,total_value_usd=?,description=? WHERE id=?');
  stmt.run(client??current.client,address??current.address,start_date??current.start_date,status??current.status,total_value_usd??current.total_value_usd,description??current.description,req.params.id);
  res.json({success:true});
});
app.delete('/api/projects/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM projects WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});
app.get('/api/projects/:id',(req,res)=>{
  const row=db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  res.json(row);
});
app.get('/api/employees',(req,res)=>{
  const rows=db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/employees',(req,res)=>{
  const{name,sin_number,role,hourly_rate,phone}=req.body;
  const stmt=db.prepare('INSERT INTO employees(name,sin_number,role,hourly_rate,phone)VALUES(?,?,?,?,?)');
  const result=stmt.run(name,sin_number,role,hourly_rate,phone);
  res.json({id:result.lastInsertRowid});
});
app.put('/api/employees/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{name,sin_number,role,hourly_rate,phone}=req.body;
  const stmt=db.prepare('UPDATE employees SET name=?,sin_number=?,role=?,hourly_rate=?,phone=? WHERE id=?');
  stmt.run(name??current.name,sin_number??current.sin_number,role??current.role,hourly_rate??current.hourly_rate,phone??current.phone,req.params.id);
  res.json({success:true});
});
app.delete('/api/employees/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM employees WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});
app.get('/api/financial',(req,res)=>{
  const rows=db.prepare('SELECT * FROM financial ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/financial',(req,res)=>{
  const{date,type,description,value_usd,category,project_id}=req.body;
  const stmt=db.prepare('INSERT INTO financial(date,type,description,value_usd,category,project_id)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(date,type,description,value_usd,category,project_id);
  res.json({id:result.lastInsertRowid});
});
app.get('/api/quotes',(req,res)=>{
  const rows=db.prepare('SELECT * FROM quotes ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/quotes',(req,res)=>{
  const{client,address,date,total_value_usd,description,status}=req.body;
  const stmt=db.prepare('INSERT INTO quotes(client,address,date,total_value_usd,description,status)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(client,address,date,total_value_usd,description,status||'Pending');
  res.json({id:result.lastInsertRowid});
});
app.put('/api/quotes/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM quotes WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{client,address,date,total_value_usd,description,status}=req.body;
  const stmt=db.prepare('UPDATE quotes SET client=?,address=?,date=?,total_value_usd=?,description=?,status=? WHERE id=?');
  stmt.run(client??current.client,address??current.address,date??current.date,total_value_usd??current.total_value_usd,description??current.description,status??current.status,req.params.id);
  res.json({success:true});
});
app.delete('/api/quotes/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM quotes WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});
app.get('/api/daily',(req,res)=>{
  const rows=db.prepare('SELECT d.*,p.client as project_name,e.name as employee_name FROM daily_reports d LEFT JOIN projects p ON d.project_id=p.id LEFT JOIN employees e ON d.employee_id=e.id ORDER BY d.id DESC').all();
  res.json(rows);
});
app.post('/api/daily',(req,res)=>{
  const{project_id,date,employee_id,hours,description,weather}=req.body;
  const stmt=db.prepare('INSERT INTO daily_reports(project_id,date,employee_id,hours,description,weather)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(project_id,date,employee_id,hours,description,weather);
  res.json({id:result.lastInsertRowid});
});
app.put('/api/daily/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM daily_reports WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{project_id,date,employee_id,hours,description,weather}=req.body;
  const stmt=db.prepare('UPDATE daily_reports SET project_id=?,date=?,employee_id=?,hours=?,description=?,weather=? WHERE id=?');
  stmt.run(project_id??current.project_id,date??current.date,employee_id??current.employee_id,hours??current.hours,description??current.description,weather??current.weather,req.params.id);
  res.json({success:true});
});
app.delete('/api/daily/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM daily_reports WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});
app.get('/api/materials',(req,res)=>{
  const rows=db.prepare('SELECT m.*,p.client as project_name FROM materials m LEFT JOIN projects p ON m.project_id=p.id ORDER BY m.id DESC').all();
  res.json(rows);
});
app.post('/api/materials',(req,res)=>{
  const{name,unit,quantity,price_usd,supplier,project_id}=req.body;
  const stmt=db.prepare('INSERT INTO materials(name,unit,quantity,price_usd,supplier,project_id)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(name,unit,quantity,price_usd,supplier,project_id);
  res.json({id:result.lastInsertRowid});
});
app.put('/api/materials/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM materials WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{name,unit,quantity,price_usd,supplier,project_id}=req.body;
  const stmt=db.prepare('UPDATE materials SET name=?,unit=?,quantity=?,price_usd=?,supplier=?,project_id=? WHERE id=?');
  stmt.run(name??current.name,unit??current.unit,quantity??current.quantity,price_usd??current.price_usd,supplier??current.supplier,project_id??current.project_id,req.params.id);
  res.json({success:true});
});
app.delete('/api/materials/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM materials WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});
app.get('/api/tools',(req,res)=>{
  const rows=db.prepare('SELECT t.*,e.name as employee_name FROM tools t LEFT JOIN employees e ON t.employee_id=e.id ORDER BY t.id DESC').all();
  res.json(rows);
});
app.post('/api/tools',(req,res)=>{
  const{name,brand,serial_number,status,location,employee_id}=req.body;
  const stmt=db.prepare('INSERT INTO tools(name,brand,serial_number,status,location,employee_id)VALUES(?,?,?,?,?,?)');
  const result=stmt.run(name,brand,serial_number,status,location,employee_id);
  res.json({id:result.lastInsertRowid});
});
app.put('/api/tools/:id',(req,res)=>{
  const current=db.prepare('SELECT * FROM tools WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({error:'Not found'});
  const{name,brand,serial_number,status,location,employee_id}=req.body;
  const stmt=db.prepare('UPDATE tools SET name=?,brand=?,serial_number=?,status=?,location=?,employee_id=? WHERE id=?');
  stmt.run(name??current.name,brand??current.brand,serial_number??current.serial_number,status??current.status,location??current.location,employee_id??current.employee_id,req.params.id);
  res.json({success:true});
});
app.delete('/api/tools/:id',(req,res)=>{
  const stmt=db.prepare('DELETE FROM tools WHERE id=?');
  stmt.run(req.params.id);
  res.json({success:true});
});

app.listen(port,()=>console.log('Backend rodando na porta '+port));
