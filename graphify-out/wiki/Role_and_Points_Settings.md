# Role and Points Settings

> 25 nodes · cohesion 0.09

## Key Concepts

- **registry.js** (50 connections) — `commands/registry.js`
- **setcontrolrole.js** (6 connections) — `commands/admin/setcontrolrole.js`
- **setinvitepoints.js** (6 connections) — `commands/admin/setinvitepoints.js`
- **handleSetControlRole()** (2 connections) — `commands/admin/setcontrolrole.js`
- **handleSetInvitePoints()** (2 connections) — `commands/admin/setinvitepoints.js`
- **dbOperations** (1 connections) — `commands/admin/setcontrolrole.js`
- **stateManager** (1 connections) — `commands/admin/setcontrolrole.js`
- **dbOperations** (1 connections) — `commands/admin/setinvitepoints.js`
- **stateManager** (1 connections) — `commands/admin/setinvitepoints.js`
- **{ handleAsknow }** (1 connections) — `commands/registry.js`
- **{ handleHelp }** (1 connections) — `commands/registry.js`
- **{ handleKnowledge }** (1 connections) — `commands/registry.js`
- **{ handleLeaderboard }** (1 connections) — `commands/registry.js`
- **{ handleMilestones }** (1 connections) — `commands/registry.js`
- **{ handlePoints }** (1 connections) — `commands/registry.js`
- **{ handlePostdaily }** (1 connections) — `commands/registry.js`
- **{ handleRank }** (1 connections) — `commands/registry.js`
- **{ handleRelinkpoll }** (1 connections) — `commands/registry.js`
- **{ handleResolve }** (1 connections) — `commands/registry.js`
- **{ handleSetCC }** (1 connections) — `commands/registry.js`
- **{ handleSetControlRole }** (1 connections) — `commands/registry.js`
- **{ handleSetInvitePoints }** (1 connections) — `commands/registry.js`
- **{ handleSettings }** (1 connections) — `commands/registry.js`
- **{ handleSetWelcome }** (1 connections) — `commands/registry.js`
- **{ SlashCommandBuilder }** (1 connections) — `commands/registry.js`

## Relationships

- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (8 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (6 shared connections)
- [Milestone Roles and Points](Milestone_Roles_and_Points.md) (4 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (2 shared connections)
- [Poll Resolution Modes](Poll_Resolution_Modes.md) (2 shared connections)
- [Knowledge Base Entry](Knowledge_Base_Entry.md) (2 shared connections)
- [Leaderboard Embed](Leaderboard_Embed.md) (2 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (2 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (2 shared connections)
- [Slash Command Definitions](Slash_Command_Definitions.md) (1 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (1 shared connections)

## Source Files

- `commands/admin/setcontrolrole.js`
- `commands/admin/setinvitepoints.js`
- `commands/registry.js`

## Audit Trail

- EXTRACTED: 58 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*