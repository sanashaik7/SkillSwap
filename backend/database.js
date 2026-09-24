const Database = require("better-sqlite3");

const db = new Database("skillswap.db");

// Enable foreign keys
db.pragma("foreign_keys = ON");


// ==========================================
// CREATE GIGS TABLE
// ==========================================
db.exec(`
    CREATE TABLE IF NOT EXISTS gigs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        rate REAL NOT NULL,
        description TEXT NOT NULL,
        creatorName TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);


// ==========================================
// CREATE BOOKINGS TABLE
// ==========================================
db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gigId INTEGER NOT NULL,
        clientName TEXT NOT NULL,
        creatorName TEXT NOT NULL,
        message TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (gigId)
        REFERENCES gigs(id)
    )
`);


// ==========================================
// UPDATE OLD DATABASE
// Add message column if it doesn't exist
// ==========================================
try {
    db.exec(`
        ALTER TABLE bookings
        ADD COLUMN message TEXT DEFAULT ''
    `);

    console.log("Added message column to bookings table.");
} catch (error) {
    // Column already exists, so nothing to do
}


// ==========================================
// DATABASE CONNECTED
// ==========================================
console.log("SkillSwap database connected successfully!");


// ==========================================
// EXPORT DATABASE
// ==========================================
module.exports = db;