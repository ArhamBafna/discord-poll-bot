# Embeds, Polls & Leaderboard

> 37 nodes

## Key Concepts

- **embeds.js** (16 connections) — `lib/embeds.js`
- **relinkpoll.js** (15 connections) — `commands/admin/relinkpoll.js`
- **resolve.js** (15 connections) — `commands/admin/resolve.js`
- **resolution.js** (13 connections) — `services/polls/resolution.js`
- **leaderboard.js** (7 connections) — `commands/user/leaderboard.js`
- **generateTextWithRetries()** (6 connections) — `services/ai/generation.js`
- **handleRelinkpoll()** (5 connections) — `commands/admin/relinkpoll.js`
- **handleResolve()** (5 connections) — `commands/admin/resolve.js`
- **createLeaderboardEmbed()** (5 connections) — `lib/embeds.js`
- **postWeeklySummary()** (5 connections) — `services/polls/posting.js`
- **resolveLastPoll()** (5 connections) — `services/polls/resolution.js`
- **createSuccessEmbed()** (4 connections) — `lib/embeds.js`
- **replyError()** (4 connections) — `lib/embeds.js`
- **replySuccess()** (4 connections) — `lib/embeds.js`
- **resolveDaily()** (3 connections) — `commands/admin/resolve.js`
- **resolveOnDemand()** (3 connections) — `commands/admin/resolve.js`
- **handleLeaderboard()** (3 connections) — `commands/user/leaderboard.js`
- **createAnswerEmbed()** (3 connections) — `lib/embeds.js`
- **normalizeResolveMode()** (2 connections) — `commands/admin/resolve.js`
- **createErrorEmbed()** (2 connections) — `lib/embeds.js`
- **dbOperations** (1 connections) — `commands/admin/relinkpoll.js`
- **{ EmbedBuilder }** (1 connections) — `commands/admin/relinkpoll.js`
- **{ generateTextWithRetries }** (1 connections) — `commands/admin/relinkpoll.js`
- **{ replySuccess, replyError }** (1 connections) — `commands/admin/relinkpoll.js`
- **stateManager** (1 connections) — `commands/admin/relinkpoll.js`
- *... and 12 more nodes in this community*

## Relationships

- [Command Registry & User Rank](Command_Registry_&_User_Rank.md) (6 shared connections)
- [Daily Poll Posting & Scheduling](Daily_Poll_Posting_&_Scheduling.md) (5 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (4 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (3 shared connections)
- [Admin Roles, Milestones & Points](Admin_Roles,_Milestones_&_Points.md) (3 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (3 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (2 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (2 shared connections)
- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (1 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (1 shared connections)

## Source Files

- `commands/admin/relinkpoll.js`
- `commands/admin/resolve.js`
- `commands/user/leaderboard.js`
- `lib/embeds.js`
- `services/ai/generation.js`
- `services/polls/posting.js`
- `services/polls/resolution.js`

## Audit Trail

- EXTRACTED: 73 (85%)
- INFERRED: 13 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*