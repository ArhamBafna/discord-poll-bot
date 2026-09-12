// Snapshot the live database (schema + data) to a JSON file.
// Usage: node tools/db/backup.js <output-file>
// Env: DATABASE_URL must be set.
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
const { KNOWN_TABLES, sortRows, hashSnapshot } = require('./tables');

async function main() {
    const outFile = process.argv[2];
    if (!outFile) {
        console.error('Usage: node tools/db/backup.js <output-file>');
        process.exit(2);
    }
    if (!process.env.DATABASE_URL) {
        console.error('Missing env: set DATABASE_URL.');
        process.exit(2);
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const schemaRes = await pool.query(
            `SELECT table_name, column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = ANY($1)
             ORDER BY table_name, ordinal_position`,
            [KNOWN_TABLES]
        );
        const indexRes = await pool.query(
            `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`
        );
        const tables = {};
        for (const t of KNOWN_TABLES) {
            const res = await pool.query(`SELECT * FROM "${t}"`);
            tables[t] = sortRows(res.rows);
        }
        const snapshot = {
            meta: { taken_at: new Date().toISOString(), tables: KNOWN_TABLES },
            schema: { columns: schemaRes.rows, indexes: indexRes.rows },
            data: tables,
            hash: hashSnapshot(crypto, tables)
        };
        fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
        console.log(`Backup done: ${outFile} hash=${snapshot.hash}`);
    } finally {
        await pool.end();
    }
}

main().catch(err => { console.error('Backup failed: ' + err.message); process.exit(1); });
