// Restore the database from a snapshot file. Tables must already exist
// (start the bot once so it creates them, or create them by hand).
// Usage: node tools/db/restore.js <snapshot-file>
// Env: DATABASE_URL must be set (target database).
const fs = require('fs');
const { Pool } = require('pg');
const { KNOWN_TABLES, sortRows, stableStringify } = require('./tables');

async function main() {
    const snapFile = process.argv[2];
    if (!snapFile) {
        console.error('Usage: node tools/db/restore.js <snapshot-file>');
        process.exit(2);
    }
    if (!process.env.DATABASE_URL) {
        console.error('Missing env: set DATABASE_URL.');
        process.exit(2);
    }
    const snapshot = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const t of KNOWN_TABLES) {
            await client.query(`TRUNCATE TABLE "${t}"`);
        }
        for (const t of KNOWN_TABLES) {
            const rows = snapshot.data && snapshot.data[t] ? sortRows(snapshot.data[t]) : [];
            for (const row of rows) {
                const cols = Object.keys(row).sort();
                if (cols.length === 0) continue;
                const placeholders = cols.map((_, i) => '$' + (i + 1)).join(', ');
                const quoted = cols.map(c => '"' + c.replace(/"/g, '""') + '"').join(', ');
                const values = cols.map(c => {
                    const v = row[c];
                    return (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
                });
                await client.query(`INSERT INTO "${t}" (${quoted}) VALUES (${placeholders})`, values);
            }
        }
        await client.query('COMMIT');
        const counts = {};
        for (const t of KNOWN_TABLES) {
            const res = await pool.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
            counts[t] = res.rows[0].n;
        }
        console.log('Restore done. Row counts: ' + stableStringify(counts));
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => { console.error('Restore failed: ' + err.message); process.exit(1); });
