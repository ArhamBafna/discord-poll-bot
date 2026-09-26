# Bot Entry Point & Clients

> 14 nodes

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

- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (5 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (4 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (3 shared connections)
- [Bot Startup & Config Validation](Bot_Startup_&_Config_Validation.md) (2 shared connections)
- [Message Handling & AI Sessions](Message_Handling_&_AI_Sessions.md) (2 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (2 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (2 shared connections)
- [Welcome Message Settings](Welcome_Message_Settings.md) (1 shared connections)
- [Project Dependencies & Scripts](Project_Dependencies_&_Scripts.md) (1 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (1 shared connections)
- [Command Registry & User Rank](Command_Registry_&_User_Rank.md) (1 shared connections)

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