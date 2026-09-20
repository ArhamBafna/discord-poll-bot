# Graph Report - discord-poll-bot  (2026-09-20)

## Corpus Check
- 66 files · ~57,631 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 515 nodes · 836 edges · 33 communities
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0525b57c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- manager.js
- generation.js
- posting.js
- resolve.js
- operations.js
- message.js
- package.json
- index.js
- backup.test.js
- ready.js
- settings.js
- registry.js
- Discord AI Poll Bot
- Database runbook
- db-init.test.js
- migrate-test.js
- ExpiringMap
- db-operations.test.js
- help.js
- embeds.js
- interaction.js
- knowledge.js
- setcc.js
- setinvitepoints.js
- serviceHelpers.js
- invites.js
- startup.js
- engagement.js
- Handoff: HeavenCloud Deployment & Bot Setup
- ai/client.js
- config/index.js
- setcontrolrole.js

## God Nodes (most connected - your core abstractions)
1. `sortRows()` - 11 edges
2. `hashSnapshot()` - 11 edges
3. `log()` - 11 edges
4. `handleMessageCreate()` - 10 edges
5. `handleReady()` - 10 edges
6. `generateTextWithOpenRouter()` - 10 edges
7. `ExpiringMap` - 9 edges
8. `stableStringify()` - 9 edges
9. `startBot()` - 9 edges
10. `generateTriviaPoll()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `handleReady()` --calls--> `checkAndPostEngagement()`  [EXTRACTED]
  handlers/ready.js → services/engagement.js
- `handleReady()` --calls--> `cacheAndSyncInvites()`  [EXTRACTED]
  handlers/ready.js → services/invites/tracking.js
- `handleReady()` --calls--> `postWeeklySummary()`  [EXTRACTED]
  handlers/ready.js → services/polls/posting.js
- `handleReady()` --calls--> `runCentralizedDailyPost()`  [EXTRACTED]
  handlers/ready.js → services/polls/posting.js
- `handleReady()` --calls--> `checkForMissedPolls()`  [EXTRACTED]
  handlers/ready.js → services/polls/scheduling.js

## Import Cycles
- None detected.

## Communities (33 total, 0 thin omitted)

### Community 0 - "manager.js"
Cohesion: 0.33
Nodes (3): handleRank(), stateManager, serverStateCache

### Community 1 - "generation.js"
Cohesion: 0.11
Nodes (28): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, ai, { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }, generateDiscussionPoll(), { generateTextWithOpenRouter, OPENROUTER_ENDPOINT, normalizeOpenRouterMessages } (+20 more)

### Community 2 - "posting.js"
Cohesion: 0.10
Nodes (28): dbOperations, { getNYDateString }, handlePostdaily(), { performDailyPost }, stateManager, { createLeaderboardEmbed }, dbOperations, { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } (+20 more)

### Community 3 - "resolve.js"
Cohesion: 0.09
Nodes (26): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+18 more)

### Community 4 - "operations.js"
Cohesion: 0.08
Nodes (18): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+10 more)

### Community 5 - "message.js"
Cohesion: 0.11
Nodes (24): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+16 more)

### Community 6 - "package.json"
Cohesion: 0.09
Nodes (21): @google/genai, node-cron, dependencies, discord.js, @google/genai, node-cron, pg, description (+13 more)

### Community 7 - "index.js"
Cohesion: 0.17
Nodes (13): initializeDatabase(), { log }, pool, handleReady(), discordClient, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+5 more)

### Community 8 - "backup.test.js"
Cohesion: 0.05
Nodes (52): assert, crypto, fileA, fileB, fileC, fs, makeSnapshot(), original (+44 more)

### Community 9 - "ready.js"
Cohesion: 0.10
Nodes (19): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls } (+11 more)

### Community 10 - "settings.js"
Cohesion: 0.20
Nodes (10): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, handleSettings(), { renderWelcomeTemplate }, stateManager, dbOperations, handleSetWelcome(), { renderWelcomeTemplate }, stateManager (+2 more)

### Community 11 - "registry.js"
Cohesion: 0.12
Nodes (16): { handleAsknow }, { handleHelp }, { handleKnowledge }, { handleLeaderboard }, { handleMilestones }, { handlePoints }, { handlePostdaily }, { handleRank } (+8 more)

### Community 12 - "Discord AI Poll Bot"
Cohesion: 0.25
Nodes (7): Commands, Discord AI Poll Bot, Features, How it works, Local setup, Other, Quick start

### Community 13 - "Database runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 14 - "db-init.test.js"
Cohesion: 0.12
Nodes (15): assert, backupSource, codecSource, fs, initSource, migrateTestSource, migration1Source, migration3Source (+7 more)

### Community 15 - "migrate-test.js"
Cohesion: 0.40
Nodes (5): fs, listMigrations(), main(), path, { Pool }

### Community 16 - "ExpiringMap"
Cohesion: 0.16
Nodes (5): ExpiringMap, assert, ExpiringMap, { setTimeout }, test

### Community 18 - "db-operations.test.js"
Cohesion: 0.18
Nodes (10): assert, codecs, doubleParsed, knownSettingsKeys, numericKnowledge, parsed, plain, pollObj (+2 more)

### Community 19 - "help.js"
Cohesion: 0.33
Nodes (6): registry, { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { createInfoEmbed }, handleHelp(), { registry }, createInfoEmbed()

### Community 20 - "embeds.js"
Cohesion: 0.15
Nodes (17): dbOperations, { EmbedBuilder }, { generateTextWithRetries }, handleRelinkpoll(), { replySuccess, replyError }, stateManager, { createLeaderboardEmbed }, handleLeaderboard() (+9 more)

### Community 21 - "interaction.js"
Cohesion: 0.33
Nodes (5): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, dbOperations, handleInteractionCreate(), { registry }, stateManager

### Community 22 - "knowledge.js"
Cohesion: 0.50
Nodes (3): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager

### Community 23 - "setcc.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetCC(), stateManager

### Community 24 - "setinvitepoints.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetInvitePoints(), stateManager

### Community 25 - "serviceHelpers.js"
Cohesion: 0.16
Nodes (19): callWithRetries(), circuitBreakers, convQueue, { generateTextWithOpenRouter }, isRetryableError(), metrics, processConvQueue(), promiseWithTimeout() (+11 more)

### Community 26 - "invites.js"
Cohesion: 0.16
Nodes (13): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate } (+5 more)

### Community 27 - "startup.js"
Cohesion: 0.24
Nodes (11): applyNetworkDefaults(), validateConfig(), assert, { startBot, loginWithTimeout }, { testDiscordGateway }, { DISCORD_BOT_TOKEN, applyNetworkDefaults, validateConfig }, https, { log } (+3 more)

### Community 28 - "engagement.js"
Cohesion: 0.23
Nodes (12): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+4 more)

### Community 29 - "Handoff: HeavenCloud Deployment & Bot Setup"
Cohesion: 0.18
Nodes (10): 1. Windows Zip Backslash Pathology (`MODULE_NOT_FOUND`), 2. Missing Environment Variables (`DATABASE_URL is not a valid URL`), 3. Syntax Errors in Commands & Handlers, Current Status, Errors Encountered & What Changed, Handoff: HeavenCloud Deployment & Bot Setup, How to Create the HeavenCloud Compatible Zip, Inclusions & Exclusions (+2 more)

### Community 30 - "ai/client.js"
Cohesion: 0.25
Nodes (6): ai, { Client, GatewayIntentBits }, discordClient, { GEMINI_API_KEY }, { GoogleGenAI }, { log }

### Community 31 - "config/index.js"
Cohesion: 0.29
Nodes (5): getSanitizedDbUrl(), { getSanitizedDbUrl }, { Pool }, assert, config

### Community 32 - "setcontrolrole.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetControlRole(), stateManager

## Knowledge Gaps
- **289 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `log()` connect `index.js` to `ready.js`, `startup.js`, `ai/client.js`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `generateTextWithOpenRouter()` connect `serviceHelpers.js` to `generation.js`, `embeds.js`, `message.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._
- **Should `posting.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1028225806451613 - nodes in this community are weakly interconnected._
- **Should `resolve.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09462365591397849 - nodes in this community are weakly interconnected._
- **Should `operations.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07681365576102418 - nodes in this community are weakly interconnected._