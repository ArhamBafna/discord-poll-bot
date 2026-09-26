# Bot Startup & Config Validation

> 15 nodes

## Key Concepts

- **startup.js** (15 connections) — `utils/startup.js`
- **startBot()** (9 connections) — `utils/startup.js`
- **startup.test.js** (8 connections) — `test/startup.test.js`
- **applyNetworkDefaults()** (4 connections) — `config/index.js`
- **testDiscordGateway()** (4 connections) — `utils/startup.js`
- **validateConfig()** (3 connections) — `config/index.js`
- **loginWithTimeout()** (3 connections) — `utils/startup.js`
- **assert** (1 connections) — `test/startup.test.js`
- **{ startBot, loginWithTimeout }** (1 connections) — `test/startup.test.js`
- **{ testDiscordGateway }** (1 connections) — `test/startup.test.js`
- **{ DISCORD_BOT_TOKEN, applyNetworkDefaults, validateConfig }** (1 connections) — `utils/startup.js`
- **https** (1 connections) — `utils/startup.js`
- **{ log }** (1 connections) — `utils/startup.js`
- **ref_dns** (1 connections)
- **ref_https** (1 connections)

## Relationships

- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (5 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (4 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (2 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (1 shared connections)

## Source Files

- `config/index.js`
- `test/startup.test.js`
- `utils/startup.js`

## Audit Trail

- EXTRACTED: 28 (85%)
- INFERRED: 5 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*