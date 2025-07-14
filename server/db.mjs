import Database from 'better-sqlite3';

let db;

try {
    db = new Database('./database/discoverhealth.db', { verbose: console.log });
    console.log('Connected to SQLite database');
} catch (err) {
    console.error('Database connection error:', err);
    throw err; // Stop execution if connection fails
}

export default db;