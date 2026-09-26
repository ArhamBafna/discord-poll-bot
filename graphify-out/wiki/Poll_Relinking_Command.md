# Poll Relinking Command

> 14 nodes · cohesion 0.21

## Key Concepts

- **embeds.js** (16 connections) — `lib/embeds.js`
- **relinkpoll.js** (15 connections) — `commands/admin/relinkpoll.js`
- **generateTextWithRetries()** (6 connections) — `services/ai/generation.js`
- **handleRelinkpoll()** (5 connections) — `commands/admin/relinkpoll.js`
- **replyError()** (4 connections) — `lib/embeds.js`
- **replySuccess()** (4 connections) — `lib/embeds.js`
- **createErrorEmbed()** (2 connections) — `lib/embeds.js`
- **dbOperations** (1 connections) — `commands/admin/relinkpoll.js`
- **{ EmbedBuilder }** (1 connections) — `commands/admin/relinkpoll.js`
- **{ generateTextWithRetries }** (1 connections) — `commands/admin/relinkpoll.js`
- **{ replySuccess, replyError }** (1 connections) — `commands/admin/relinkpoll.js`
- **stateManager** (1 connections) — `commands/admin/relinkpoll.js`
- **COLORS** (1 connections) — `lib/embeds.js`
- **{ EmbedBuilder }** (1 connections) — `lib/embeds.js`

## Relationships

- [Poll Resolution Modes](Poll_Resolution_Modes.md) (5 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (3 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (2 shared connections)
- [Role and Points Settings](Role_and_Points_Settings.md) (2 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (2 shared connections)
- [Leaderboard Embed](Leaderboard_Embed.md) (2 shared connections)
- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (2 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (1 shared connections)

## Source Files

- `commands/admin/relinkpoll.js`
- `lib/embeds.js`
- `services/ai/generation.js`

## Audit Trail

- EXTRACTED: 31 (78%)
- INFERRED: 9 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*