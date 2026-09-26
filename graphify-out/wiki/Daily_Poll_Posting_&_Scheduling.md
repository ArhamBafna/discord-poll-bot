# Daily Poll Posting & Scheduling

> 41 nodes

## Key Concepts

- **posting.js** (40 connections) — `services/polls/posting.js`
- **scheduling.js** (15 connections) — `services/polls/scheduling.js`
- **posting-messages.test.js** (12 connections) — `test/posting-messages.test.js`
- **getOrGenerateDailyPoll()** (7 connections) — `services/polls/posting.js`
- **performDailyPost()** (7 connections) — `services/polls/posting.js`
- **checkForMissedPolls()** (7 connections) — `services/polls/scheduling.js`
- **runCentralizedDailyPost()** (6 connections) — `services/polls/posting.js`
- **getNYDateString()** (6 connections) — `utils/dateUtils.js`
- **fallbacks.js** (4 connections) — `services/polls/fallbacks.js`
- **dateUtils.js** (4 connections) — `utils/dateUtils.js`
- **getPollIntroMessage()** (3 connections) — `services/polls/posting.js`
- **getNYWeekString()** (3 connections) — `utils/dateUtils.js`
- **FALLBACK_DISCUSSION_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **FALLBACK_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **config_index_target_channel_ids** (3 connections)
- **relabelKind()** (1 connections) — `test/posting-messages.test.js`
- **{ createLeaderboardEmbed }** (1 connections) — `services/polls/posting.js`
- **dbOperations** (1 connections) — `services/polls/posting.js`
- **{ FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }** (1 connections) — `services/polls/posting.js`
- **{ generateTextWithRetries }** (1 connections) — `services/polls/posting.js`
- **{ generateTriviaPoll, generateDiscussionPoll }** (1 connections) — `services/polls/posting.js`
- **{ getNYDateString, getNYWeekString }** (1 connections) — `services/polls/posting.js`
- **pollResolution** (1 connections) — `services/polls/posting.js`
- **pool** (1 connections) — `services/polls/posting.js`
- **postingLock** (1 connections) — `services/polls/posting.js`
- *... and 16 more nodes in this community*

## Relationships

- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (9 shared connections)
- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (5 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (5 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (4 shared connections)
- [Logging & Service Initialization](Logging_&_Service_Initialization.md) (2 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (2 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (2 shared connections)

## Source Files

- `services/polls/fallbacks.js`
- `services/polls/posting.js`
- `services/polls/scheduling.js`
- `test/posting-messages.test.js`
- `utils/dateUtils.js`

## Audit Trail

- EXTRACTED: 81 (91%)
- INFERRED: 8 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*