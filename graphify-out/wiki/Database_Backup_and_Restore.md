# Database Backup and Restore

> 12 nodes · cohesion 0.21

## Key Concepts

- **backup.js** (12 connections) — `tools/db/backup.js`
- **restore.js** (10 connections) — `tools/db/restore.js`
- **tables.js** (9 connections) — `tools/db/tables.js`
- **KNOWN_TABLES** (6 connections) — `tools/db/tables.js`
- **pg** (5 connections) — `package.json`
- **crypto** (1 connections) — `tools/db/backup.js`
- **fs** (1 connections) — `tools/db/backup.js`
- **{ KNOWN_TABLES, sortRows, hashSnapshot }** (1 connections) — `tools/db/backup.js`
- **{ Pool }** (1 connections) — `tools/db/backup.js`
- **fs** (1 connections) — `tools/db/restore.js`
- **{ KNOWN_TABLES, sortRows, stableStringify }** (1 connections) — `tools/db/restore.js`
- **{ Pool }** (1 connections) — `tools/db/restore.js`

## Relationships

- [Backup Validation and Hashing](Backup_Validation_and_Hashing.md) (12 shared connections)
- [Migration Test Runner](Migration_Test_Runner.md) (3 shared connections)
- [Backup Test Fixtures](Backup_Test_Fixtures.md) (2 shared connections)
- [Table Sorting Test Fixtures](Table_Sorting_Test_Fixtures.md) (2 shared connections)
- [Package Manifest and Dependencies](Package_Manifest_and_Dependencies.md) (1 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (1 shared connections)

## Source Files

- `package.json`
- `tools/db/backup.js`
- `tools/db/restore.js`
- `tools/db/tables.js`

## Audit Trail

- EXTRACTED: 32 (91%)
- INFERRED: 3 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*