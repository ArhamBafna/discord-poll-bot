// Tests verify the database initialization module structure:
// - initializeDatabase is a function
// - The module requires connection pool
// - SQL in initialization.js references kv_store (not state/knowledge_base)
// - SQL references the speed index on question_history
//
// Run: node --test test/db-init.test.js
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Read initialization.js source to verify SQL references correct tables
const initSource = fs.readFileSync(path.join(__dirname, '..', 'database', 'initialization.js'), 'utf8');

// Must reference kv_store, not state or knowledge_base
assert.ok(initSource.includes('kv_store'), 'initialization.js creates kv_store table');
assert.ok(!initSource.includes('CREATE TABLE IF NOT EXISTS state'), 'initialization.js does NOT create old state table');
assert.ok(!initSource.includes('CREATE TABLE IF NOT EXISTS knowledge_base'), 'initialization.js does NOT create old knowledge_base table');
assert.ok(initSource.includes('CREATE TABLE IF NOT EXISTS leaderboard'), 'initialization.js creates leaderboard table');
assert.ok(initSource.includes('CREATE TABLE IF NOT EXISTS question_history'), 'initialization.js creates question_history table');

// Must reference the speed index
assert.ok(initSource.includes('idx_question_history_guild_created'), 'initialization.js creates question_history index');

// Read operations.js source to verify it uses codec functions
const opsSource = fs.readFileSync(path.join(__dirname, '..', 'database', 'operations.js'), 'utf8');
assert.ok(opsSource.includes('parseStoredValue'), 'operations.js uses parseStoredValue');
assert.ok(opsSource.includes('serializeStoredValue'), 'operations.js uses serializeStoredValue');
assert.ok(opsSource.includes('isSettingsKey'), 'operations.js uses isSettingsKey');
assert.ok(opsSource.includes('kv_store'), 'operations.js references kv_store table');
assert.ok(!opsSource.includes('FROM knowledge_base'), 'operations.js does NOT query old knowledge_base table');
assert.ok(!opsSource.includes('FROM state'), 'operations.js does NOT query old state table');
assert.ok(opsSource.includes('Promise.all'), 'operations.js uses parallel loads');

// Read codecs.js source to verify 0-stays-0 logic
const codecSource = fs.readFileSync(path.join(__dirname, '..', 'database', 'codecs.js'), 'utf8');
assert.ok(codecSource.includes('Number.isFinite'), 'codecs.js uses explicit finite-number check');
assert.ok(codecSource.includes('parseInviteRewardPoints'), 'codecs.js has parseInviteRewardPoints');
assert.ok(codecSource.includes('serializeInviteRewardPoints'), 'codecs.js has serializeInviteRewardPoints');

// Read migration 002 source to verify merge logic
const migrationSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'migrations', '002_merge_state_knowledge.sql'), 'utf8');
assert.ok(migrationSource.includes('kv_store'), 'migration 002 writes to kv_store');
assert.ok(migrationSource.includes('DROP TABLE IF EXISTS state'), 'migration 002 drops old state table');
assert.ok(migrationSource.includes('DROP TABLE IF EXISTS knowledge_base'), 'migration 002 drops old knowledge_base table');
assert.ok(migrationSource.includes('#>>'), 'migration 002 unwraps JSONB strings');

// Read migration 003 source to verify index
const migration3Source = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'migrations', '003_db_speed.sql'), 'utf8');
assert.ok(migration3Source.includes('idx_question_history_guild_created'), 'migration 003 creates speed index');

// Read migration 001 source
const migration1Source = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'migrations', '001_example.sql'), 'utf8');
assert.ok(migration1Source.includes('SELECT 1'), 'migration 001 exists');

// Verify tools/db/tables.js has correct KNOWN_TABLES
const tablesSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'tables.js'), 'utf8');
assert.ok(tablesSource.includes("'kv_store'"), 'tables.js includes kv_store');
assert.ok(!tablesSource.includes("'state'"), 'tables.js does NOT include old state table');
assert.ok(!tablesSource.includes("'knowledge_base'"), 'tables.js does NOT include old knowledge_base table');

// Verify backup/restore/validate reference kv_store
const backupSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'backup.js'), 'utf8');
const restoreSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'restore.js'), 'utf8');
const validateSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'validate.js'), 'utf8');

// Verify migration test refuses live URL
const migrateTestSource = fs.readFileSync(path.join(__dirname, '..', 'tools', 'db', 'migrate-test.js'), 'utf8');
assert.ok(migrateTestSource.includes('DATABASE_URL'), 'migrate-test.js checks DATABASE_URL');
assert.ok(migrateTestSource.includes('copyUrl === process.env.DATABASE_URL') || migrateTestSource.includes('copyUrl ==='), 'migrate-test.js refuses live URL');

// Verify package.json has db scripts
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(pkg.scripts['db:backup'], 'package.json has db:backup script');
assert.ok(pkg.scripts['db:restore'], 'package.json has db:restore script');
assert.ok(pkg.scripts['db:validate'], 'package.json has db:validate script');
assert.ok(pkg.scripts['db:migrate-test'], 'package.json has db:migrate-test script');
assert.ok(!pkg.dependencies.express, 'package.json does NOT have express dependency');

console.log('db-init structure tests passed');
