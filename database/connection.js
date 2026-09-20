const { getSanitizedDbUrl } = require('../config');

const dbUrl = getSanitizedDbUrl();
let pool;

if (dbUrl && dbUrl.includes('neon.tech')) {
    const { Pool: NeonPool, neonConfig } = require('@neondatabase/serverless');
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
    neonConfig.poolQueryViaFetch = true; // Use HTTP fetch instead of WebSockets to bypass HeavenCloud WSS blocking
    pool = new NeonPool({ connectionString: dbUrl });
} else {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: dbUrl });
}

module.exports = pool;

