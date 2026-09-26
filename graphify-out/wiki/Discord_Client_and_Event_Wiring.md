# Discord Client and Event Wiring

> 14 nodes · cohesion 0.15

## Key Concepts

- **index.js** (26 connections) — `index.js`
- **discord.js** (9 connections) — `package.json`
- **bot/client.js** (6 connections) — `bot/client.js`
- **ai** (1 connections) — `bot/client.js`
- **{ Client, GatewayIntentBits }** (1 connections) — `bot/client.js`
- **discordClient** (1 connections) — `bot/client.js`
- **discordClient** (1 connections) — `index.js`
- **{ Events }** (1 connections) — `index.js`
- **{ handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }** (1 connections) — `index.js`
- **{ handleInteractionCreate }** (1 connections) — `index.js`
- **{ handleMessageCreate }** (1 connections) — `index.js`
- **{ handleReady }** (1 connections) — `index.js`
- **{ log }** (1 connections) — `index.js`
- **{ startBot }** (1 connections) — `index.js`

## Relationships

- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (4 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (4 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (3 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (3 shared connections)
- [Message Chat and AI Conversation](Message_Chat_and_AI_Conversation.md) (2 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (2 shared connections)
- [Gemini AI Client](Gemini_AI_Client.md) (1 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (1 shared connections)
- [Package Manifest and Dependencies](Package_Manifest_and_Dependencies.md) (1 shared connections)
- [Knowledge Base Entry](Knowledge_Base_Entry.md) (1 shared connections)
- [Slash Command Definitions](Slash_Command_Definitions.md) (1 shared connections)
- [Role and Points Settings](Role_and_Points_Settings.md) (1 shared connections)

## Source Files

- `bot/client.js`
- `index.js`
- `package.json`

## Audit Trail

- EXTRACTED: 38 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*