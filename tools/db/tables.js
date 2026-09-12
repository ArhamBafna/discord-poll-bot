const KNOWN_TABLES = [
    'leaderboard',
    'state',
    'question_history',
    'knowledge_base',
    'invites',
    'command_stats'
];

function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    if (Buffer.isBuffer(value)) return JSON.stringify(value.toString('utf8'));
    if (value instanceof Date) return JSON.stringify(value.toISOString());
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function sortRows(rows) {
    return rows.slice().sort((a, b) => {
        const sa = stableStringify(a);
        const sb = stableStringify(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
}

function hashSnapshot(crypto, tables) {
    const h = crypto.createHash('sha256');
    for (const t of KNOWN_TABLES) {
        const rows = tables[t] ? sortRows(tables[t]) : [];
        h.update(t + ':' + rows.length + ':');
        for (const r of rows) h.update(stableStringify(r) + '\n');
    }
    return h.digest('hex');
}

module.exports = { KNOWN_TABLES, stableStringify, sortRows, hashSnapshot };
