# Database Connection and Logging

> 8 nodes · cohesion 0.25

## Key Concepts

- **connection.js** (12 connections) — `database/connection.js`
- **initialization.js** (7 connections) — `database/initialization.js`
- **logger.js** (6 connections) — `utils/logger.js`
- **getSanitizedDbUrl()** (2 connections) — `config/index.js`
- **dbUrl** (1 connections) — `database/connection.js`
- **{ getSanitizedDbUrl }** (1 connections) — `database/connection.js`
- **{ log }** (1 connections) — `database/initialization.js`
- **pool** (1 connections) — `database/initialization.js`

## Relationships

- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (5 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (3 shared connections)
- [Package Manifest and Dependencies](Package_Manifest_and_Dependencies.md) (2 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (2 shared connections)
- [Database Backup and Restore](Database_Backup_and_Restore.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (1 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (1 shared connections)
- [Gemini AI Client](Gemini_AI_Client.md) (1 shared connections)

## Source Files

- `config/index.js`
- `database/connection.js`
- `database/initialization.js`
- `utils/logger.js`

## Audit Trail

- EXTRACTED: 21 (88%)
- INFERRED: 3 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*