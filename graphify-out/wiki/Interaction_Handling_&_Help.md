# Interaction Handling & Help

> 18 nodes

## Key Concepts

- **interaction.js** (13 connections) — `handlers/interaction.js`
- **settings.js** (11 connections) — `commands/admin/settings.js`
- **help.js** (9 connections) — `commands/user/help.js`
- **config_index_allowed_username** (5 connections)
- **handleHelp()** (4 connections) — `commands/user/help.js`
- **registry** (4 connections) — `commands/registry.js`
- **createInfoEmbed()** (3 connections) — `lib/embeds.js`
- **config_index_control_role_name** (3 connections)
- **handleInteractionCreate()** (2 connections) — `handlers/interaction.js`
- **{ ALLOWED_USERNAME, CONTROL_ROLE_NAME }** (1 connections) — `commands/admin/settings.js`
- **{ renderWelcomeTemplate }** (1 connections) — `commands/admin/settings.js`
- **stateManager** (1 connections) — `commands/admin/settings.js`
- **{ ALLOWED_USERNAME, CONTROL_ROLE_NAME }** (1 connections) — `commands/user/help.js`
- **{ createInfoEmbed }** (1 connections) — `commands/user/help.js`
- **{ ALLOWED_USERNAME, CONTROL_ROLE_NAME }** (1 connections) — `handlers/interaction.js`
- **dbOperations** (1 connections) — `handlers/interaction.js`
- **{ registry }** (1 connections) — `handlers/interaction.js`
- **stateManager** (1 connections) — `handlers/interaction.js`

## Relationships

- [Command Registry & User Rank](Command_Registry_&_User_Rank.md) (5 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (3 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (2 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (2 shared connections)
- [Welcome Message Settings](Welcome_Message_Settings.md) (2 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (2 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (1 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (1 shared connections)
- [Message Handling & AI Sessions](Message_Handling_&_AI_Sessions.md) (1 shared connections)

## Source Files

- `commands/admin/settings.js`
- `commands/registry.js`
- `commands/user/help.js`
- `handlers/interaction.js`
- `lib/embeds.js`

## Audit Trail

- EXTRACTED: 38 (90%)
- INFERRED: 4 (10%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*