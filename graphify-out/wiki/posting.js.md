# posting.js

> 52 nodes

## Key Concepts

- **posting.js** (42 connections) — `services/polls/posting.js`
- **scheduling.js** (16 connections) — `services/polls/scheduling.js`
- **catch-up.test.js** (15 connections) — `test/catch-up.test.js`
- **posting-messages.test.js** (12 connections) — `test/posting-messages.test.js`
- **checkForMissedPolls()** (8 connections) — `services/polls/scheduling.js`
- **getOrGenerateDailyPoll()** (7 connections) — `services/polls/posting.js`
- **performDailyPost()** (7 connections) — `services/polls/posting.js`
- **runCentralizedDailyPost()** (6 connections) — `services/polls/posting.js`
- **getNYDateString()** (6 connections) — `utils/dateUtils.js`
- **fallbacks.js** (4 connections) — `services/polls/fallbacks.js`
- **dateUtils.js** (4 connections) — `utils/dateUtils.js`
- **getPollIntroMessage()** (3 connections) — `services/polls/posting.js`
- **getNYWeekString()** (3 connections) — `utils/dateUtils.js`
- **FALLBACK_DISCUSSION_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **FALLBACK_POLLS** (3 connections) — `services/polls/fallbacks.js`
- **config_index_target_channel_ids** (3 connections)
- **fakeChannel()** (1 connections) — `test/catch-up.test.js`
- **statesByGuild()** (1 connections) — `test/catch-up.test.js`
- **withFakeClock()** (1 connections) — `test/catch-up.test.js`
- **relabelKind()** (1 connections) — `test/posting-messages.test.js`
- **{ createLeaderboardEmbed }** (1 connections) — `services/polls/posting.js`
- **dbOperations** (1 connections) — `services/polls/posting.js`
- **{ FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }** (1 connections) — `services/polls/posting.js`
- **{ generateTextWithRetries }** (1 connections) — `services/polls/posting.js`
- **{ generateTriviaPoll, generateDiscussionPoll }** (1 connections) — `services/polls/posting.js`
- *... and 27 more nodes in this community*

## Relationships

- [generation.js](generation.js.md) (9 shared connections)
- [ready.js](ready.js.md) (7 shared connections)
- [poll.js](poll.js.md) (5 shared connections)
- [config/index.js](config-index.js.md) (3 shared connections)
- [manager.js](manager.js.md) (3 shared connections)
- [operations.js](operations.js.md) (3 shared connections)
- [db-init.test.js](db-init.test.js.md) (2 shared connections)

## Source Files

- `services/polls/fallbacks.js`
- `services/polls/posting.js`
- `services/polls/scheduling.js`
- `test/catch-up.test.js`
- `test/posting-messages.test.js`
- `utils/dateUtils.js`

## Audit Trail

- EXTRACTED: 97 (92%)
- INFERRED: 8 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*