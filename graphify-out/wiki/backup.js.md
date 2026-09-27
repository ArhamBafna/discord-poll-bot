# backup.js

> 12 nodes

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

- [validate.js](validate.js.md) (12 shared connections)
- [migrate-test.js](migrate-test.js.md) (3 shared connections)
- [backup.test.js](backup.test.js.md) (2 shared connections)
- [tables.test.js](tables.test.js.md) (2 shared connections)
- [package.json](package.json.md) (1 shared connections)
- [config/index.js](config-index.js.md) (1 shared connections)

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