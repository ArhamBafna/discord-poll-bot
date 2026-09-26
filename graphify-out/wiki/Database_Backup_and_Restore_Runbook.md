# Database Backup and Restore Runbook

> 9 nodes · cohesion 0.33

## Key Concepts

- **PostgreSQL Leaderboard Store** (4 connections) — `README.md`
- **Live Database Backup Step** (4 connections) — `tools/db/RUNBOOK.md`
- **Copy Test Database** (4 connections) — `tools/db/RUNBOOK.md`
- **Migration Test Against Copy** (3 connections) — `tools/db/RUNBOOK.md`
- **Backup Restore into Copy** (3 connections) — `tools/db/RUNBOOK.md`
- **Backup Restores Same State Proof** (2 connections) — `tools/db/RUNBOOK.md`
- **Never Touch Live Data On Failure** (2 connections) — `tools/db/RUNBOOK.md`
- **Backup Comparison Validation** (2 connections) — `tools/db/RUNBOOK.md`
- **Neon HTTP Fetch DB Connection** (1 connections) — `current-prod-status.md`

## Relationships

- [Discord Poll UI and Embeds](Discord_Poll_UI_and_Embeds.md) (1 shared connections)

## Source Files

- `README.md`
- `current-prod-status.md`
- `tools/db/RUNBOOK.md`

## Audit Trail

- EXTRACTED: 8 (62%)
- INFERRED: 5 (38%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*