# Bot Startup and Scheduled Jobs

> 19 nodes · cohesion 0.12

## Key Concepts

- **ready.js** (41 connections) — `handlers/ready.js`
- **handleReady()** (10 connections) — `handlers/ready.js`
- **postWeeklySummary()** (5 connections) — `services/polls/posting.js`
- **initializeDatabase()** (4 connections) — `database/initialization.js`
- **checkAndPostEngagement()** (4 connections) — `services/engagement.js`
- **{ cacheAndSyncInvites }** (1 connections) — `handlers/ready.js`
- **{ checkAndPostEngagement }** (1 connections) — `handlers/ready.js`
- **{ checkForMissedPolls }** (1 connections) — `handlers/ready.js`
- **{ commands, rest }** (1 connections) — `handlers/ready.js`
- **cron** (1 connections) — `handlers/ready.js`
- **dbOperations** (1 connections) — `handlers/ready.js`
- **{ initializeDatabase }** (1 connections) — `handlers/ready.js`
- **{ log }** (1 connections) — `handlers/ready.js`
- **{ Routes }** (1 connections) — `handlers/ready.js`
- **{ runCentralizedDailyPost, postWeeklySummary }** (1 connections) — `handlers/ready.js`
- **serviceHelpers** (1 connections) — `handlers/ready.js`
- **stateManager** (1 connections) — `handlers/ready.js`
- **{ syncAllMilestoneRoles }** (1 connections) — `handlers/ready.js`
- **{ TARGET_CHANNEL_IDS }** (1 connections) — `handlers/ready.js`

## Relationships

- [Daily Post and Fallback Polls](Daily_Post_and_Fallback_Polls.md) (8 shared connections)
- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (4 shared connections)
- [Database Connection and Logging](Database_Connection_and_Logging.md) (3 shared connections)
- [Milestone Roles and Points](Milestone_Roles_and_Points.md) (3 shared connections)
- [Slash Command Definitions](Slash_Command_Definitions.md) (3 shared connections)
- [Invite Tracking and Cache](Invite_Tracking_and_Cache.md) (3 shared connections)
- [Engagement Channel Announcements](Engagement_Channel_Announcements.md) (3 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (3 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (1 shared connections)
- [Package Manifest and Dependencies](Package_Manifest_and_Dependencies.md) (1 shared connections)

## Source Files

- `database/initialization.js`
- `handlers/ready.js`
- `services/engagement.js`
- `services/polls/posting.js`

## Audit Trail

- EXTRACTED: 53 (93%)
- INFERRED: 4 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*