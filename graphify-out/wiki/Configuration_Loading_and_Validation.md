# Configuration Loading and Validation

> 18 nodes · cohesion 0.19

## Key Concepts

- **config/index.js** (18 connections) — `config/index.js`
- **startup.js** (15 connections) — `utils/startup.js`
- **log()** (13 connections) — `utils/logger.js`
- **startBot()** (9 connections) — `utils/startup.js`
- **startup.test.js** (8 connections) — `test/startup.test.js`
- **applyNetworkDefaults()** (4 connections) — `config/index.js`
- **testDiscordGateway()** (4 connections) — `utils/startup.js`
- **validateConfig()** (3 connections) — `config/index.js`
- **main()** (3 connections) — `index.js`
- **loginWithTimeout()** (3 connections) — `utils/startup.js`
- **ref_dns** (1 connections)
- **ref_https** (1 connections)
- **assert** (1 connections) — `test/startup.test.js`
- **{ startBot, loginWithTimeout }** (1 connections) — `test/startup.test.js`
- **{ testDiscordGateway }** (1 connections) — `test/startup.test.js`
- **{ DISCORD_BOT_TOKEN, applyNetworkDefaults, validateConfig }** (1 connections) — `utils/startup.js`
- **https** (1 connections) — `utils/startup.js`
- **{ log }** (1 connections) — `utils/startup.js`

## Relationships

- [Database Connection and Logging](Database_Connection_and_Logging.md) (5 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (4 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (4 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (3 shared connections)
- [Slash Command Definitions](Slash_Command_Definitions.md) (2 shared connections)
- [Gemini AI Client](Gemini_AI_Client.md) (2 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (2 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (2 shared connections)
- [Config and DB Init Test Fixtures](Config_and_DB_Init_Test_Fixtures.md) (2 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (1 shared connections)
- [Message Chat and AI Conversation](Message_Chat_and_AI_Conversation.md) (1 shared connections)

## Source Files

- `config/index.js`
- `index.js`
- `test/startup.test.js`
- `utils/logger.js`
- `utils/startup.js`

## Audit Trail

- EXTRACTED: 51 (88%)
- INFERRED: 7 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*