# validate.js

> 14 nodes

## Key Concepts

- **validate.js** (12 connections) — `tools/db/validate.js`
- **hashSnapshot()** (11 connections) — `tools/db/tables.js`
- **sortRows()** (11 connections) — `tools/db/tables.js`
- **stableStringify()** (11 connections) — `tools/db/tables.js`
- **tableHash()** (4 connections) — `tools/db/validate.js`
- **ref_crypto** (4 connections)
- **main()** (3 connections) — `tools/db/backup.js`
- **main()** (3 connections) — `tools/db/restore.js`
- **main()** (3 connections) — `tools/db/validate.js`
- **makeSnapshot()** (2 connections) — `test/backup.test.js`
- **runValidate()** (2 connections) — `test/backup.test.js`
- **crypto** (1 connections) — `tools/db/validate.js`
- **fs** (1 connections) — `tools/db/validate.js`
- **{ KNOWN_TABLES, sortRows, stableStringify, hashSnapshot }** (1 connections) — `tools/db/validate.js`

## Relationships

- [backup.js](backup.js.md) (12 shared connections)
- [backup.test.js](backup.test.js.md) (6 shared connections)
- [tables.test.js](tables.test.js.md) (4 shared connections)
- [migrate-test.js](migrate-test.js.md) (1 shared connections)

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