# Settings Codec Serialization

> 38 nodes · cohesion 0.08

## Key Concepts

- **operations.js** (45 connections) — `database/operations.js`
- **codecs.js** (13 connections) — `database/codecs.js`
- **codecs.test.js** (12 connections) — `test/codecs.test.js`
- **isSettingsKey()** (7 connections) — `database/codecs.js`
- **parseStoredValue()** (6 connections) — `database/codecs.js`
- **serializeStoredValue()** (6 connections) — `database/codecs.js`
- **loadStateForGuild()** (4 connections) — `database/operations.js`
- **CODECS** (3 connections) — `database/codecs.js`
- **getStateValue()** (3 connections) — `database/operations.js`
- **resetGuildState()** (2 connections) — `database/operations.js`
- **saveStateToDB()** (2 connections) — `database/operations.js`
- **updateAndPersist()** (2 connections) — `database/operations.js`
- **parseInviteRewardPoints()** (1 connections) — `database/codecs.js`
- **parseJson()** (1 connections) — `database/codecs.js`
- **parseText()** (1 connections) — `database/codecs.js`
- **serializeInviteRewardPoints()** (1 connections) — `database/codecs.js`
- **serializeJson()** (1 connections) — `database/codecs.js`
- **serializeText()** (1 connections) — `database/codecs.js`
- **admin_removeUserScore()** (1 connections) — `database/operations.js`
- **admin_saveKnowledgeBase()** (1 connections) — `database/operations.js`
- **admin_setOrAddUserScore()** (1 connections) — `database/operations.js`
- **batchUpdateScoresInDB()** (1 connections) — `database/operations.js`
- **{ CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }** (1 connections) — `database/operations.js`
- **deleteStateFromDB()** (1 connections) — `database/operations.js`
- **getGlobalStateValue()** (1 connections) — `database/operations.js`
- *... and 13 more nodes in this community*

## Relationships

- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (3 shared connections)
- [Config and DB Init Test Fixtures](Config_and_DB_Init_Test_Fixtures.md) (2 shared connections)
- [Milestone Roles and Points](Milestone_Roles_and_Points.md) (2 shared connections)
- [Poll Resolution Modes](Poll_Resolution_Modes.md) (2 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (2 shared connections)
- [Role and Points Settings](Role_and_Points_Settings.md) (2 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (2 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (1 shared connections)
- [Knowledge Base Entry](Knowledge_Base_Entry.md) (1 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (1 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (1 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (1 shared connections)

## Source Files

- `database/codecs.js`
- `database/operations.js`
- `test/codecs.test.js`

## Audit Trail

- EXTRACTED: 55 (71%)
- INFERRED: 22 (29%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*