# Graph Report - discord-poll-bot  (2026-09-26)

## Corpus Check
- Corpus is ~27,953 words - fits in a single context window. You may not need a graph.

## Summary
- 583 nodes · 961 edges · 34 communities (32 shown, 2 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a55a63a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExpiringMap
- AI Poll & Text Generation
- DB Backup, Restore & Tables
- Bot Startup & Config Validation
- Embeds, Polls & Leaderboard
- Invite Tracking & Guild Events
- Admin Roles, Milestones & Points
- Interaction Handling & Help
- Engagement Posts
- SetCC Command
- Welcome Message Settings
- Config & DB Connection
- Settings Codec Serialization
- Logging & Service Initialization
- State Manager & Knowledge Commands
- SetInvitePoints Command
- Daily Poll Posting & Scheduling
- DB Init & Migration Tests
- Command Registry & User Rank
- Message Handling & AI Sessions
- Bot Ready & Command Definitions
- DB Operations Tests
- Bot Entry Point & Clients
- Discord AI Poll Bot
- Database Runbook
- Issue tracker: GitHub
- Domain Docs
- Question History Index
- Knowledge State Migration
- Current Live Production Status
- Agent Skills & Docs
- Project Dependencies & Scripts
- Poll Embeds & Gamification

## God Nodes (most connected - your core abstractions)
1. `log()` - 13 edges
2. `hashSnapshot()` - 11 edges
3. `sortRows()` - 11 edges
4. `stableStringify()` - 11 edges
5. `generateTextWithOpenRouter()` - 10 edges
6. `handleReady()` - 10 edges
7. `handleMessageCreate()` - 10 edges
8. `Poll Embed Card` - 10 edges
9. `ExpiringMap` - 9 edges
10. `startBot()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `makeSnapshot()` --calls--> `hashSnapshot()`  [EXTRACTED]
  test/backup.test.js → tools/db/tables.js
- `runValidate()` --calls--> `hashSnapshot()`  [EXTRACTED]
  test/backup.test.js → tools/db/tables.js
- `startBot()` --calls--> `main()`  [EXTRACTED]
  utils/startup.js → index.js
- `postWeeklySummary()` --calls--> `handleReady()`  [EXTRACTED]
  services/polls/posting.js → handlers/ready.js
- `cacheAndSyncInvites()` --calls--> `handleReady()`  [EXTRACTED]
  services/invites/tracking.js → handlers/ready.js

## Import Cycles
- 2-file cycle: `commands/registry.js -> commands/user/help.js -> commands/registry.js`

## Communities (34 total, 2 thin omitted)

### Community 14 - "ExpiringMap"
Cohesion: 0.14
Nodes (7): ExpiringMap, assert, ExpiringMap, { setTimeout }, test, ref_node_test, ref_node_timers

### Community 1 - "AI Poll & Text Generation"
Cohesion: 0.07
Nodes (47): handleAsknow(), callWithRetries(), isRetryableError(), processConvQueue(), promiseWithTimeout(), startConvQueueWorker(), generateDiscussionPoll(), generateTriviaPoll() (+39 more)

### Community 11 - "DB Backup, Restore & Tables"
Cohesion: 0.05
Nodes (56): makeSnapshot(), runValidate(), main(), main(), hashSnapshot(), sortRows(), stableStringify(), main() (+48 more)

### Community 12 - "Bot Startup & Config Validation"
Cohesion: 0.20
Nodes (13): applyNetworkDefaults(), validateConfig(), loginWithTimeout(), startBot(), testDiscordGateway(), assert, { startBot, loginWithTimeout }, { testDiscordGateway } (+5 more)

### Community 13 - "Embeds, Polls & Leaderboard"
Cohesion: 0.08
Nodes (32): handleRelinkpoll(), handleResolve(), normalizeResolveMode(), resolveDaily(), resolveOnDemand(), handleLeaderboard(), createAnswerEmbed(), createErrorEmbed() (+24 more)

### Community 16 - "Invite Tracking & Guild Events"
Cohesion: 0.16
Nodes (13): handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), cacheAndSyncInvites(), { ALLOWED_USERNAME }, dbOperations, { inviteCache, cacheAndSyncInvites }, pool (+5 more)

### Community 18 - "Admin Roles, Milestones & Points"
Cohesion: 0.20
Nodes (11): handleMilestones(), handlePoints(), checkAndAssignMilestoneRole(), syncAllMilestoneRoles(), dbOperations, stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole } (+3 more)

### Community 2 - "Interaction Handling & Help"
Cohesion: 0.14
Nodes (15): handleHelp(), handleInteractionCreate(), createInfoEmbed(), { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { renderWelcomeTemplate }, stateManager, registry, { ALLOWED_USERNAME, CONTROL_ROLE_NAME } (+7 more)

### Community 22 - "Engagement Posts"
Cohesion: 0.23
Nodes (12): checkAndPostEngagement(), findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel(), pickChannelByNames(), ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, COMMAND_DESCRIPTIONS (+4 more)

### Community 23 - "SetCC Command"
Cohesion: 0.50
Nodes (3): handleSetCC(), dbOperations, stateManager

### Community 25 - "Welcome Message Settings"
Cohesion: 0.29
Nodes (7): handleSettings(), handleSetWelcome(), handleGuildMemberAdd(), renderWelcomeTemplate(), dbOperations, { renderWelcomeTemplate }, stateManager

### Community 27 - "Config & DB Connection"
Cohesion: 0.25
Nodes (6): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }, assert, config, ref_node_assert

### Community 3 - "Settings Codec Serialization"
Cohesion: 0.08
Nodes (18): isSettingsKey(), parseStoredValue(), serializeStoredValue(), getStateValue(), loadStateForGuild(), resetGuildState(), saveStateToDB(), updateAndPersist() (+10 more)

### Community 30 - "Logging & Service Initialization"
Cohesion: 0.20
Nodes (11): initializeDatabase(), handleReady(), main(), log(), { log }, pool, { GEMINI_API_KEY }, { GoogleGenAI } (+3 more)

### Community 32 - "State Manager & Knowledge Commands"
Cohesion: 0.18
Nodes (7): handleKnowledge(), handleSetControlRole(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, stateManager, serverStateCache

### Community 37 - "SetInvitePoints Command"
Cohesion: 0.50
Nodes (3): handleSetInvitePoints(), dbOperations, stateManager

### Community 4 - "Daily Poll Posting & Scheduling"
Cohesion: 0.07
Nodes (35): getOrGenerateDailyPoll(), getPollIntroMessage(), performDailyPost(), runCentralizedDailyPost(), checkForMissedPolls(), getNYDateString(), getNYWeekString(), FALLBACK_DISCUSSION_POLLS (+27 more)

### Community 5 - "DB Init & Migration Tests"
Cohesion: 0.09
Nodes (21): listMigrations(), main(), assert, backupSource, codecSource, fs, initSource, migrateTestSource (+13 more)

### Community 7 - "Command Registry & User Rank"
Cohesion: 0.11
Nodes (17): handleRank(), { handleAsknow }, { handleHelp }, { handleKnowledge }, { handleLeaderboard }, { handleMilestones }, { handlePoints }, { handleRank } (+9 more)

### Community 8 - "Message Handling & AI Sessions"
Cohesion: 0.11
Nodes (24): buildAiContents(), computeProactiveRelevanceScore(), getSessionKey(), handleMessageCreate(), hasActiveSession(), isLikelySessionFollowUp(), isNoReplySignal(), markActiveSession() (+16 more)

### Community 10 - "Bot Ready & Command Definitions"
Cohesion: 0.10
Nodes (20): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls } (+12 more)

### Community 15 - "DB Operations Tests"
Cohesion: 0.18
Nodes (10): assert, codecs, doubleParsed, knownSettingsKeys, numericKnowledge, parsed, plain, pollObj (+2 more)

### Community 17 - "Bot Entry Point & Clients"
Cohesion: 0.15
Nodes (12): ai, { Client, GatewayIntentBits }, discordClient, discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+4 more)

### Community 19 - "Discord AI Poll Bot"
Cohesion: 0.29
Nodes (6): Commands, Discord AI Poll Bot, Features, How it works, Other, Quick start / Local setup

### Community 24 - "Database Runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 29 - "Issue tracker: GitHub"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 31 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 36 - "Current Live Production Status"
Cohesion: 0.40
Nodes (4): Archive / Legacy: HeavenCloud Notes & Past Fixes, Current Live Production Status, Current Live Production Status, Server Management Quick Reference

### Community 6 - "Agent Skills & Docs"
Cohesion: 0.67
Nodes (3): Agent skills, Domain docs, Issue tracker

### Community 9 - "Project Dependencies & Scripts"
Cohesion: 0.09
Nodes (22): dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron, pg, ws, description (+14 more)

### Community 0 - "Poll Embeds & Gamification"
Cohesion: 0.13
Nodes (28): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, Button-Style Poll Options, Correct Answer Reveal, Discord Dark Theme Styling, @everyone Poll Ping, Leaderboard Update Section, Leaderboard Update Notice (+20 more)

## Ambiguous Edges - Review These
- `AI/ML Tech Trivia Question Domain` → `OWGT Bot Identity`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **302 isolated node(s):** `dbOperations`, `{ generateTriviaPoll }`, `stateManager`, `circuitBreakers`, `convQueue` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `AI/ML Tech Trivia Question Domain` and `OWGT Bot Identity`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `pg` connect `DB Backup, Restore & Tables` to `Project Dependencies & Scripts`, `Config & DB Connection`, `DB Init & Migration Tests`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `discord.js` connect `Bot Entry Point & Clients` to `State Manager & Knowledge Commands`, `Command Registry & User Rank`, `Project Dependencies & Scripts`, `Bot Ready & Command Definitions`, `Embeds, Polls & Leaderboard`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `dbOperations`, `{ generateTriviaPoll }`, `stateManager` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ExpiringMap` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._
- **Should `AI Poll & Text Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.06568832983927324 - nodes in this community are weakly interconnected._