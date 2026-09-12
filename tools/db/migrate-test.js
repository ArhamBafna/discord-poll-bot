// Run migration SQL files against a COPY of the database, never the live one.
// Usage: node tools/db/migrate-test.js <copy-database-url> [migrations-dir]
// Reports pass/fail per file. Refuses to run when the copy URL equals DATABASE_URL.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function listMigrations(dir) {
    return fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
}

async function main() {
    const copyUrl = process.argv[2];
    const dir = process.argv[3] || path.join(__dirname, 'migrations');
    if (!copyUrl) {
        console.error('Usage: node tools/db/migrate-test.js <copy-database-url> [migrations-dir]');
        process.exit(2);
    }
    if (process.env.DATABASE_URL && copyUrl === process.env.DATABASE_URL) {
        console.error('Refused: copy URL equals live DATABASE_URL. Use a separate copy database.');
        process.exit(2);
    }
    const files = listMigrations(dir);
    if (files.length === 0) {
        console.log('No migration files found. PASS (nothing to run).');
        return;
    }
    const pool = new Pool({ connectionString: copyUrl });
    let failed = 0;
    try {
        for (const f of files) {
            const sql = fs.readFileSync(path.join(dir, f), 'utf8');
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('ROLLBACK');
                console.log(`PASS ${f} (dry run, rolled back)`);
            } catch (err) {
                await client.query('ROLLBACK');
                failed++;
                console.error(`FAIL ${f}: ${err.message}`);
            } finally {
                client.release();
            }
        }
        if (failed > 0) {
            console.error(`Result: FAIL (${failed}/${files.length} files failed)`);
            process.exit(1);
        }
        console.log(`Result: PASS (${files.length}/${files.length} files)`);
    } finally {
        await pool.end();
    }
}

main().catch(err => { console.error('Migration test failed: ' + err.message); process.exit(1); });
