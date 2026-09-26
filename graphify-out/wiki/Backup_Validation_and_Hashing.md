# Backup Validation and Hashing

> 14 nodes · cohesion 0.24

## Key Concepts

- **validate.js** (12 connections) — `tools/db/validate.js`
- **hashSnapshot()** (11 connections) — `tools/db/tables.js`
- **sortRows()** (11 connections) — `tools/db/tables.js`
- **stableStringify()** (11 connections) — `tools/db/tables.js`
- **ref_crypto** (4 connections)
- **tableHash()** (4 connections) — `tools/db/validate.js`
- **main()** (3 connections) — `tools/db/backup.js`
- **main()** (3 connections) — `tools/db/restore.js`
- **main()** (3 connections) — `tools/db/validate.js`
- **makeSnapshot()** (2 connections) — `test/backup.test.js`
- **runValidate()** (2 connections) — `test/backup.test.js`
- **crypto** (1 connections) — `tools/db/validate.js`
- **fs** (1 connections) — `tools/db/validate.js`
- **{ KNOWN_TABLES, sortRows, stableStringify, hashSnapshot }** (1 connections) — `tools/db/validate.js`

## Relationships

- [Database Backup and Restore](Database_Backup_and_Restore.md) (12 shared connections)
- [Backup Test Fixtures](Backup_Test_Fixtures.md) (6 shared connections)
- [Table Sorting Test Fixtures](Table_Sorting_Test_Fixtures.md) (4 shared connections)
- [Migration Test Runner](Migration_Test_Runner.md) (1 shared connections)

## Source Files

- `test/backup.test.js`
- `tools/db/backup.js`
- `tools/db/restore.js`
- `tools/db/tables.js`
- `tools/db/validate.js`

## Audit Trail

- EXTRACTED: 43 (93%)
- INFERRED: 3 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*