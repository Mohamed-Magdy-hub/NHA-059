const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, '..', '..', 'data', 'urls.db');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) return reject(err);
      return resolve(db);
    });
  });
}

async function init() {
  ensureDataDir();
  const db = await openDb();
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) {
        db.close(() => {});
        return reject(err);
      }
      // keep DB handle in memory by attaching to module
      module.exports._db = db;
      return resolve();
    });
  });
}

// Helper wrappers using the persisted _db
function run(sql, params = []) {
  const db = module.exports._db;
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      // return this (statement) info such as lastID
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  const db = module.exports._db;
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row);
    });
  });
}

function all(sql, params = []) {
  const db = module.exports._db;
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });
}

// DB operations
async function createUrl(originalUrl, shortCode) {
  const res = await run(
    'INSERT INTO urls (original_url, short_code, visits) VALUES (?, ?, 0)',
    [originalUrl, shortCode]
  );
  const row = await get('SELECT * FROM urls WHERE id = ?', [res.lastID]);
  return row;
}

async function getByShortCode(shortCode) {
  const row = await get('SELECT * FROM urls WHERE short_code = ?', [shortCode]);
  return row;
}

async function getByOriginalUrl(originalUrl) {
  const row = await get('SELECT * FROM urls WHERE original_url = ?', [originalUrl]);
  return row;
}

async function incrementVisits(id) {
  await run('UPDATE urls SET visits = visits + 1 WHERE id = ?', [id]);
}

async function getAll() {
  const rows = await all('SELECT * FROM urls ORDER BY created_at DESC', []);
  return rows;
}

module.exports = {
  init,
  createUrl,
  getByShortCode,
  getByOriginalUrl,
  incrementVisits,
  getAll,
  // helpers for testing/debug
  _openDb: openDb
};