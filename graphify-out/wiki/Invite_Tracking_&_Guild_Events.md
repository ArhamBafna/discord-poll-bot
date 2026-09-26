# Invite Tracking & Guild Events

> 15 nodes

## Key Concepts

- **invites.js** (21 connections) — `handlers/invites.js`
- **tracking.js** (7 connections) — `services/invites/tracking.js`
- **cacheAndSyncInvites()** (5 connections) — `services/invites/tracking.js`
- **handleGuildCreate()** (3 connections) — `handlers/invites.js`
- **handleInviteCreate()** (2 connections) — `handlers/invites.js`
- **handleInviteDelete()** (2 connections) — `handlers/invites.js`
- **inviteCache** (2 connections) — `services/invites/tracking.js`
- **{ ALLOWED_USERNAME }** (1 connections) — `handlers/invites.js`
- **dbOperations** (1 connections) — `handlers/invites.js`
- **{ inviteCache, cacheAndSyncInvites }** (1 connections) — `handlers/invites.js`
- **pool** (1 connections) — `handlers/invites.js`
- **{ renderWelcomeTemplate }** (1 connections) — `handlers/invites.js`
- **stateManager** (1 connections) — `handlers/invites.js`
- **exportedCache** (1 connections) — `services/invites/tracking.js`
- **pool** (1 connections) — `services/invites/tracking.js`

## Relationships

- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (4 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (3 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (2 shared connections)
- [Welcome Message Settings](Welcome_Message_Settings.md) (2 shared connections)
- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (1 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (1 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (1 shared connections)

## Source Files

- `handlers/invites.js`
- `services/invites/tracking.js`

## Audit Trail

- EXTRACTED: 28 (85%)
- INFERRED: 5 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*