# Settings Codec Serialization

> 38 nodes

## Key Concepts

- **operations.js** (44 connections) — `database/operations.js`
- **codecs.js** (13 connections) — `database/codecs.js`
- **codecs.test.js** (12 connections) — `test/codecs.test.js`
- **isSettingsKey()** (7 connections) — `database/codecs.js`
- **parseStoredValue()** (6 connections) — `database/codecs.js`
- **serializeStoredValue()** (6 connections) — `database/codecs.js`
- **loadStateForGuild()** (4 connections) — `database/operations.js`
- **getStateValue()** (3 connections) — `database/operations.js`
- **CODECS** (3 connections) — `database/codecs.js`
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
- **deleteStateFromDB()** (1 connections) — `database/operations.js`
- **getGlobalStateValue()** (1 connections) — `database/operations.js`
- **incrementCommandUsage()** (1 connections) — `database/operations.js`
- *... and 13 more nodes in this community*

## Relationships

- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (3 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (3 shared connections)
- [Admin Roles, Milestones & Points](Admin_Roles,_Milestones_&_Points.md) (2 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (2 shared connections)
- [Daily Poll Posting & Scheduling](Daily_Poll_Posting_&_Scheduling.md) (2 shared connections)
- [DB Operations Tests](DB_Operations_Tests.md) (1 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (1 shared connections)
- [SetCC Command](SetCC_Command.md) (1 shared connections)
- [SetInvitePoints Command](SetInvitePoints_Command.md) (1 shared connections)
- [Welcome Message Settings](Welcome_Message_Settings.md) (1 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (1 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (1 shared connections)

## Source Files

- `database/codecs.js`
- `database/operations.js`
- `test/codecs.test.js`

## Audit Trail

- EXTRACTED: 54 (71%)
- INFERRED: 22 (29%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*