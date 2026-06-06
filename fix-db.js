const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.run('DROP TABLE IF EXISTS financial');
  db.run('CREATE TABLE financial (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, description TEXT, value_usd REAL, client TEXT, date TEXT)');
  console.log('Tabela financial recriada com coluna client');
});
db.close();
