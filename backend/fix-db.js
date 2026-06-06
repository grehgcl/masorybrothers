const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
db.exec('DROP TABLE IF EXISTS financial');
db.exec('CREATE TABLE financial (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, description TEXT, value_usd REAL, client TEXT, date TEXT)');
console.log('Tabela financial recriada com sucesso');
process.exit();
