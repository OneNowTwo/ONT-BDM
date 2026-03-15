require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = path.resolve(process.env.DB_PATH || './server/db/bdm.sqlite');

// Ensure directory exists — fall back to local path if the configured dir
// can't be created (e.g. /data not yet mounted on Render)
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn(`[DB] Cannot create ${dir}: ${err.message} — falling back to local path`);
    dbPath = path.resolve('./server/db/bdm.sqlite');
    const localDir = path.dirname(dbPath);
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  }
}
console.log(`[DB] Using database at ${dbPath}`);

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema on first use
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
