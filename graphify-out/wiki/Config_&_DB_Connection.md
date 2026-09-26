# Config & DB Connection

> 9 nodes

## Key Concepts

- **config/index.js** (18 connections) — `config/index.js`
- **connection.js** (12 connections) — `database/connection.js`
- **ref_node_assert** (9 connections)
- **config.test.js** (4 connections) — `test/config.test.js`
- **getSanitizedDbUrl()** (2 connections) — `config/index.js`
- **dbUrl** (1 connections) — `database/connection.js`
- **{ getSanitizedDbUrl }** (1 connections) — `database/connection.js`
- **assert** (1 connections) — `test/config.test.js`
- **config** (1 connections) — `test/config.test.js`

## Relationships

- [Daily Poll Posting & Scheduling](Daily_Poll_Posting_&_Scheduling.md) (4 shared connections)
- [Bot Startup & Config Validation](Bot_Startup_&_Config_Validation.md) (4 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (3 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (3 shared connections)
- [DB Backup, Restore & Tables](DB_Backup,_Restore_&_Tables.md) (3 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (2 shared connections)
- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (2 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (2 shared connections)
- [Project Dependencies & Scripts](Project_Dependencies_&_Scripts.md) (2 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)
- [Message Handling & AI Sessions](Message_Handling_&_AI_Sessions.md) (1 shared connections)
- [DB Init & Migration Tests](DB_Init_&_Migration_Tests.md) (1 shared connections)

## Source Files

- `config/index.js`
- `database/connection.js`
- `test/config.test.js`

## Audit Trail

- EXTRACTED: 37 (92%)
- INFERRED: 3 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*