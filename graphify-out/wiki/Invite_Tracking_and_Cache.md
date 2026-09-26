# Invite Tracking and Cache

> 15 nodes · cohesion 0.16

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

- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (4 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (4 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (3 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (2 shared connections)
- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (1 shared connections)

## Source Files

- `handlers/invites.js`
- `services/invites/tracking.js`

## Audit Trail

- EXTRACTED: 28 (85%)
- INFERRED: 5 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*