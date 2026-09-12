const { Pool } = require('pg');
const { getSanitizedDbUrl } = require('../config');

const pool = new Pool({ connectionString: getSanitizedDbUrl() });

module.exports = pool;
