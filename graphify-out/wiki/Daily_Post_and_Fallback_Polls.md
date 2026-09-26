# Daily Post and Fallback Polls

> 36 nodes · cohesion 0.09

## Key Concepts

- **posting.js** (39 connections) — `services/polls/posting.js`
- **scheduling.js** (15 connections) — `services/polls/scheduling.js`
- **postdaily.js** (12 connections) — `commands/admin/postdaily.js`
- **performDailyPost()** (8 connections) — `services/polls/posting.js`
- **getNYDateString()** (8 connections) — `utils/dateUtils.js`
- **getOrGenerateDailyPoll()** (7 connections) — `services/polls/posting.js`
- **checkForMissedPolls()** (7 connections) — `services/polls/scheduling.js`
- **runCentralizedDailyPost()** (6 connections) — `services/polls/posting.js`
- **dateUtils.js** (5 connections) — `utils/dateUtils.js`
- **handlePostdaily()** (4 connections) — `commands/admin/postdaily.js`
- **fallbacks.js** (4 connections) — `services/polls/fallbacks.js`
- **config_index_target_channel_ids** (3 connections)
- **FALLBACK_DISCUSSION_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **FALLBACK_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **getNYWeekString()** (3 connections) — `utils/dateUtils.js`
- **dbOperations** (1 connections) — `commands/admin/postdaily.js`
- **{ getNYDateString }** (1 connections) — `commands/admin/postdaily.js`
- **{ performDailyPost }** (1 connections) — `commands/admin/postdaily.js`
- **stateManager** (1 connections) — `commands/admin/postdaily.js`
- **{ createLeaderboardEmbed }** (1 connections) — `services/polls/posting.js`
- **dbOperations** (1 connections) — `services/polls/posting.js`
- **{ FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }** (1 connections) — `services/polls/posting.js`
- **{ generateTextWithRetries }** (1 connections) — `services/polls/posting.js`
- **{ generateTriviaPoll, generateDiscussionPoll }** (1 connections) — `services/polls/posting.js`
- **{ getNYDateString, getNYWeekString }** (1 connections) — `services/polls/posting.js`
- *... and 11 more nodes in this community*

## Relationships

- [Bot Startup and Scheduled Jobs](Bot_Startup_and_Scheduled_Jobs.md) (8 shared connections)
- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (8 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (3 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (3 shared connections)
- [Role and Points Settings](Role_and_Points_Settings.md) (2 shared connections)
- [Poll Relinking Command](Poll_Relinking_Command.md) (2 shared connections)
- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (2 shared connections)
- [Leaderboard Embed](Leaderboard_Embed.md) (1 shared connections)
- [Poll Resolution Modes](Poll_Resolution_Modes.md) (1 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (1 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (1 shared connections)

## Source Files

- `commands/admin/postdaily.js`
- `services/polls/fallbacks.js`
- `services/polls/posting.js`
- `services/polls/scheduling.js`
- `utils/dateUtils.js`

## Audit Trail

- EXTRACTED: 82 (91%)
- INFERRED: 8 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*