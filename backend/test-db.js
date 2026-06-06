const db = require('./database/db');
const rows = db.prepare('SELECT * FROM financial').all();
console.log('Tabela financial OK. Registros:', rows.length);
process.exit();
