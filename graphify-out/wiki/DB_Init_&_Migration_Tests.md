# DB Init & Migration Tests

> 23 nodes

## Key Concepts

- **db-init.test.js** (18 connections) — `test/db-init.test.js`
- **migrate-test.js** (8 connections) — `tools/db/migrate-test.js`
- **ref_path** (3 connections)
- **listMigrations()** (2 connections) — `tools/db/migrate-test.js`
- **main()** (2 connections) — `tools/db/migrate-test.js`
- **assert** (1 connections) — `test/db-init.test.js`
- **backupSource** (1 connections) — `test/db-init.test.js`
- **codecSource** (1 connections) — `test/db-init.test.js`
- **fs** (1 connections) — `test/db-init.test.js`
- **initSource** (1 connections) — `test/db-init.test.js`
- **migrateTestSource** (1 connections) — `test/db-init.test.js`
- **migration1Source** (1 connections) — `test/db-init.test.js`
- **migration3Source** (1 connections) — `test/db-init.test.js`
- **migrationSource** (1 connections) — `test/db-init.test.js`
- **opsSource** (1 connections) — `test/db-init.test.js`
- **path** (1 connections) — `test/db-init.test.js`
- **pkg** (1 connections) — `test/db-init.test.js`
- **restoreSource** (1 connections) — `test/db-init.test.js`
- **tablesSource** (1 connections) — `test/db-init.test.js`
- **validateSource** (1 connections) — `test/db-init.test.js`
- **fs** (1 connections) — `tools/db/migrate-test.js`
- **path** (1 connections) — `tools/db/migrate-test.js`
- **{ Pool }** (1 connections) — `tools/db/migrate-test.js`

## Relationships

- [DB Backup, Restore & Tables](DB_Backup,_Restore_&_Tables.md) (4 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (1 shared connections)

## Source Files

- `test/db-init.test.js`
- `tools/db/migrate-test.js`

## Audit Trail

- EXTRACTED: 28 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*