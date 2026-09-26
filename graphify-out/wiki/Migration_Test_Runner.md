# Migration Test Runner

> 8 nodes · cohesion 0.29

## Key Concepts

- **migrate-test.js** (8 connections) — `tools/db/migrate-test.js`
- **ref_fs** (6 connections)
- **ref_path** (3 connections)
- **listMigrations()** (2 connections) — `tools/db/migrate-test.js`
- **main()** (2 connections) — `tools/db/migrate-test.js`
- **fs** (1 connections) — `tools/db/migrate-test.js`
- **path** (1 connections) — `tools/db/migrate-test.js`
- **{ Pool }** (1 connections) — `tools/db/migrate-test.js`

## Relationships

- [Database Backup and Restore](Database_Backup_and_Restore.md) (3 shared connections)
- [Backup Test Fixtures](Backup_Test_Fixtures.md) (2 shared connections)
- [Config and DB Init Test Fixtures](Config_and_DB_Init_Test_Fixtures.md) (2 shared connections)
- [Backup Validation and Hashing](Backup_Validation_and_Hashing.md) (1 shared connections)

## Source Files

- `tools/db/migrate-test.js`

## Audit Trail

- EXTRACTED: 16 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*