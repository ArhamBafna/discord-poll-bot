# Poll Resolution Modes

> 17 nodes · cohesion 0.17

## Key Concepts

- **resolve.js** (15 connections) — `commands/admin/resolve.js`
- **resolution.js** (13 connections) — `services/polls/resolution.js`
- **handleResolve()** (5 connections) — `commands/admin/resolve.js`
- **resolveLastPoll()** (5 connections) — `services/polls/resolution.js`
- **createSuccessEmbed()** (4 connections) — `lib/embeds.js`
- **resolveDaily()** (3 connections) — `commands/admin/resolve.js`
- **resolveOnDemand()** (3 connections) — `commands/admin/resolve.js`
- **createAnswerEmbed()** (3 connections) — `lib/embeds.js`
- **normalizeResolveMode()** (2 connections) — `commands/admin/resolve.js`
- **{ createSuccessEmbed }** (1 connections) — `commands/admin/resolve.js`
- **dbOperations** (1 connections) — `commands/admin/resolve.js`
- **{ resolveLastPoll }** (1 connections) — `commands/admin/resolve.js`
- **stateManager** (1 connections) — `commands/admin/resolve.js`
- **{ checkAndAssignMilestoneRole }** (1 connections) — `services/polls/resolution.js`
- **{ createAnswerEmbed }** (1 connections) — `services/polls/resolution.js`
- **dbOperations** (1 connections) — `services/polls/resolution.js`
- **stateManager** (1 connections) — `services/polls/resolution.js`

## Relationships

- [Poll Relinking Command](Poll_Relinking_Command.md) (5 shared connections)
- [Milestone Roles and Points](Milestone_Roles_and_Points.md) (3 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (2 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)
- [Role and Points Settings](Role_and_Points_Settings.md) (2 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (1 shared connections)

## Source Files

- `commands/admin/resolve.js`
- `lib/embeds.js`
- `services/polls/resolution.js`

## Audit Trail

- EXTRACTED: 34 (89%)
- INFERRED: 4 (11%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*