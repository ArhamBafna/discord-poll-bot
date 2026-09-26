# Milestone Roles and Points

> 14 nodes · cohesion 0.20

## Key Concepts

- **admin/milestones.js** (9 connections) — `commands/admin/milestones.js`
- **points.js** (9 connections) — `commands/admin/points.js`
- **roles/milestones.js** (8 connections) — `services/roles/milestones.js`
- **checkAndAssignMilestoneRole()** (6 connections) — `services/roles/milestones.js`
- **syncAllMilestoneRoles()** (6 connections) — `services/roles/milestones.js`
- **handleMilestones()** (3 connections) — `commands/admin/milestones.js`
- **handlePoints()** (3 connections) — `commands/admin/points.js`
- **dbOperations** (1 connections) — `commands/admin/milestones.js`
- **stateManager** (1 connections) — `commands/admin/milestones.js`
- **{ syncAllMilestoneRoles }** (1 connections) — `commands/admin/milestones.js`
- **{ checkAndAssignMilestoneRole }** (1 connections) — `commands/admin/points.js`
- **dbOperations** (1 connections) — `commands/admin/points.js`
- **stateManager** (1 connections) — `commands/admin/points.js`
- **stateManager** (1 connections) — `services/roles/milestones.js`

## Relationships

- [Role and Points Settings](Role_and_Points_Settings.md) (4 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (3 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (3 shared connections)
- [Poll Resolution Modes](Poll_Resolution_Modes.md) (3 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)

## Source Files

- `commands/admin/milestones.js`
- `commands/admin/points.js`
- `services/roles/milestones.js`

## Audit Trail

- EXTRACTED: 29 (88%)
- INFERRED: 4 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*