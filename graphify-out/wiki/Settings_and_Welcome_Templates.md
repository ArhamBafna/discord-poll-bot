# Settings and Welcome Templates

> 38 nodes · cohesion 0.07

## Key Concepts

- **serviceHelpers.js** (21 connections) — `lib/serviceHelpers.js`
- **interaction.js** (13 connections) — `handlers/interaction.js`
- **settings.js** (11 connections) — `commands/admin/settings.js`
- **setwelcome.js** (9 connections) — `commands/admin/setwelcome.js`
- **help.js** (9 connections) — `commands/user/help.js`
- **renderWelcomeTemplate()** (7 connections) — `lib/serviceHelpers.js`
- **config_index_allowed_username** (5 connections)
- **registry** (4 connections) — `commands/registry.js`
- **handleHelp()** (4 connections) — `commands/user/help.js`
- **callWithRetries()** (4 connections) — `lib/serviceHelpers.js`
- **processConvQueue()** (4 connections) — `lib/serviceHelpers.js`
- **handleSettings()** (3 connections) — `commands/admin/settings.js`
- **handleSetWelcome()** (3 connections) — `commands/admin/setwelcome.js`
- **config_index_control_role_name** (3 connections)
- **handleGuildMemberAdd()** (3 connections) — `handlers/invites.js`
- **createInfoEmbed()** (3 connections) — `lib/embeds.js`
- **handleInteractionCreate()** (2 connections) — `handlers/interaction.js`
- **isRetryableError()** (2 connections) — `lib/serviceHelpers.js`
- **promiseWithTimeout()** (2 connections) — `lib/serviceHelpers.js`
- **startConvQueueWorker()** (2 connections) — `lib/serviceHelpers.js`
- **{ ALLOWED_USERNAME, CONTROL_ROLE_NAME }** (1 connections) — `commands/admin/settings.js`
- **{ renderWelcomeTemplate }** (1 connections) — `commands/admin/settings.js`
- **stateManager** (1 connections) — `commands/admin/settings.js`
- **dbOperations** (1 connections) — `commands/admin/setwelcome.js`
- **{ renderWelcomeTemplate }** (1 connections) — `commands/admin/setwelcome.js`
- *... and 13 more nodes in this community*

## Relationships

- [Role and Points Settings](Role_and_Points_Settings.md) (8 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (4 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (4 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (3 shared connections)
- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (3 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (3 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (2 shared connections)
- [Message Chat and AI Conversation](Message_Chat_and_AI_Conversation.md) (2 shared connections)
- [Slash Command Definitions](Slash_Command_Definitions.md) (1 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (1 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (1 shared connections)

## Source Files

- `commands/admin/settings.js`
- `commands/admin/setwelcome.js`
- `commands/registry.js`
- `commands/user/help.js`
- `discord.js`
- `handlers/interaction.js`
- `handlers/invites.js`
- `lib/embeds.js`
- `lib/serviceHelpers.js`

## Audit Trail

- EXTRACTED: 70 (84%)
- INFERRED: 13 (16%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*