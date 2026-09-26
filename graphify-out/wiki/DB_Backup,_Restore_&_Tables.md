# DB Backup, Restore & Tables

> 62 nodes

## Key Concepts

- **backup.test.js** (29 connections) — `test/backup.test.js`
- **tables.test.js** (22 connections) — `test/tables.test.js`
- **backup.js** (12 connections) — `tools/db/backup.js`
- **validate.js** (12 connections) — `tools/db/validate.js`
- **hashSnapshot()** (11 connections) — `tools/db/tables.js`
- **sortRows()** (11 connections) — `tools/db/tables.js`
- **stableStringify()** (11 connections) — `tools/db/tables.js`
- **restore.js** (10 connections) — `tools/db/restore.js`
- **tables.js** (9 connections) — `tools/db/tables.js`
- **KNOWN_TABLES** (6 connections) — `tools/db/tables.js`
- **ref_fs** (6 connections)
- **pg** (5 connections) — `package.json`
- **tableHash()** (4 connections) — `tools/db/validate.js`
- **ref_crypto** (4 connections)
- **main()** (3 connections) — `tools/db/backup.js`
- **main()** (3 connections) — `tools/db/restore.js`
- **main()** (3 connections) — `tools/db/validate.js`
- **makeSnapshot()** (2 connections) — `test/backup.test.js`
- **runValidate()** (2 connections) — `test/backup.test.js`
- **assert** (1 connections) — `test/backup.test.js`
- **crypto** (1 connections) — `test/backup.test.js`
- **fileA** (1 connections) — `test/backup.test.js`
- **fileB** (1 connections) — `test/backup.test.js`
- **fileC** (1 connections) — `test/backup.test.js`
- **fs** (1 connections) — `test/backup.test.js`
- *... and 37 more nodes in this community*

## Relationships

- [DB Init & Migration Tests](DB_Init_&_Migration_Tests.md) (4 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (3 shared connections)
- [Project Dependencies & Scripts](Project_Dependencies_&_Scripts.md) (1 shared connections)

## Source Files

- `package.json`
- `test/backup.test.js`
- `test/tables.test.js`
- `tools/db/backup.js`
- `tools/db/restore.js`
- `tools/db/tables.js`
- `tools/db/validate.js`

## Audit Trail

- EXTRACTED: 105 (97%)
- INFERRED: 3 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*