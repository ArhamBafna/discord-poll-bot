// Compare two snapshot files and report pass/fail per table.
// Usage: node tools/db/validate.js <before-file> <after-file>
const fs = require('fs');
const crypto = require('crypto');
const { KNOWN_TABLES, sortRows, stableStringify, hashSnapshot } = require('./tables');

function tableHash(rows) {
    const h = crypto.createHash('sha256');
    for (const r of sortRows(rows || [])) h.update(stableStringify(r) + '\n');
    return h.digest('hex');
}

function main() {
    const [beforeFile, afterFile] = process.argv.slice(2);
    if (!beforeFile || !afterFile) {
        console.error('Usage: node tools/db/validate.js <before-file> <after-file>');
        process.exit(2);
    }
    const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
    const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
    let pass = true;
    for (const t of KNOWN_TABLES) {
        const hb = tableHash(before.data && before.data[t]);
        const ha = tableHash(after.data && after.data[t]);
        const ok = hb === ha;
        if (!ok) pass = false;
        const nb = before.data && before.data[t] ? before.data[t].length : 0;
        const na = after.data && after.data[t] ? after.data[t].length : 0;
        console.log(`${ok ? 'MATCH' : 'DIFF '} ${t} rows=${nb}/${na}`);
    }
    const overallBefore = hashSnapshot(crypto, before.data || {});
    const overallAfter = hashSnapshot(crypto, after.data || {});
    console.log(`Overall: ${pass && overallBefore === overallAfter ? 'PASS' : 'FAIL'} (${overallBefore} vs ${overallAfter})`);
    process.exit(pass && overallBefore === overallAfter ? 0 : 1);
}

main();
