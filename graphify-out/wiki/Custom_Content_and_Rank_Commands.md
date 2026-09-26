# Custom Content and Rank Commands

> 10 nodes · cohesion 0.20

## Key Concepts

- **manager.js** (26 connections) — `state/manager.js`
- **setcc.js** (6 connections) — `commands/admin/setcc.js`
- **rank.js** (4 connections) — `commands/user/rank.js`
- **handleSetCC()** (2 connections) — `commands/admin/setcc.js`
- **handleRank()** (2 connections) — `commands/user/rank.js`
- **dbOperations** (1 connections) — `commands/admin/setcc.js`
- **stateManager** (1 connections) — `commands/admin/setcc.js`
- **stateManager** (1 connections) — `commands/user/rank.js`
- **getServerState()** (1 connections) — `state/manager.js`
- **serverStateCache** (1 connections) — `state/manager.js`

## Relationships

- [Role and Points Settings](Role_and_Points_Settings.md) (6 shared connections)
- [Milestone Roles and Points](Milestone_Roles_and_Points.md) (3 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (3 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (3 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)
- [Poll Resolution Modes](Poll_Resolution_Modes.md) (2 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (1 shared connections)
- [Knowledge Base Entry](Knowledge_Base_Entry.md) (1 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (1 shared connections)
- [Leaderboard Embed](Leaderboard_Embed.md) (1 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (1 shared connections)
- [Message Chat and AI Conversation](Message_Chat_and_AI_Conversation.md) (1 shared connections)

## Source Files

- `commands/admin/setcc.js`
- `commands/user/rank.js`
- `state/manager.js`

## Audit Trail

- EXTRACTED: 33 (92%)
- INFERRED: 3 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*