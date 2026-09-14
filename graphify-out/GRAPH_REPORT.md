# Graph Report - discord-poll-bot  (2026-09-14)

## Corpus Check
- 65 files · ~20,497 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 496 nodes · 802 edges · 25 communities
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c06804e2`
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
- serviceHelpers.js
- registry.js
- OWGT Bot
- Database runbook
- db-init.test.js
- migrate-test.js
- ExpiringMap
- db-operations.test.js
- help.js
- leaderboard.js
- interaction.js
- knowledge.js
- setcc.js
- setinvitepoints.js

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
- `handleRelinkpoll()` --calls--> `generateTextWithRetries()`  [EXTRACTED]
  commands/admin/relinkpoll.js → services/ai/generation.js
- `handleReady()` --calls--> `initializeDatabase()`  [EXTRACTED]
  handlers/ready.js → database/initialization.js
- `handleReady()` --calls--> `checkAndPostEngagement()`  [EXTRACTED]
  handlers/ready.js → services/engagement.js
- `handleReady()` --calls--> `cacheAndSyncInvites()`  [EXTRACTED]
  handlers/ready.js → services/invites/tracking.js
- `handleReady()` --calls--> `syncAllMilestoneRoles()`  [EXTRACTED]
  handlers/ready.js → services/roles/milestones.js

## Import Cycles
- None detected.

## Communities (25 total, 0 thin omitted)

### Community 0 - "manager.js"
Cohesion: 0.20
Nodes (6): dbOperations, handleSetControlRole(), stateManager, handleRank(), stateManager, serverStateCache

### Community 1 - "generation.js"
Cohesion: 0.10
Nodes (31): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, ai, { FALLBACK_POLLS }, { generateTextWithOpenRouter, OPENROUTER_ENDPOINT, normalizeOpenRouterMessages }, generateTriviaPoll() (+23 more)

### Community 2 - "posting.js"
Cohesion: 0.10
Nodes (30): dbOperations, { getNYDateString }, handlePostdaily(), { performDailyPost }, stateManager, handleReady(), generateTextWithRetries(), { createLeaderboardEmbed } (+22 more)

### Community 3 - "resolve.js"
Cohesion: 0.07
Nodes (37): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+29 more)

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
Cohesion: 0.05
Nodes (47): ai, { Client, GatewayIntentBits }, discordClient, applyNetworkDefaults(), getSanitizedDbUrl(), validateConfig(), { getSanitizedDbUrl }, { Pool } (+39 more)

### Community 8 - "backup.test.js"
Cohesion: 0.05
Nodes (52): assert, crypto, fileA, fileB, fileC, fs, makeSnapshot(), original (+44 more)

### Community 9 - "ready.js"
Cohesion: 0.07
Nodes (31): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls } (+23 more)

### Community 10 - "serviceHelpers.js"
Cohesion: 0.12
Nodes (19): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, handleSettings(), { renderWelcomeTemplate }, stateManager, dbOperations, handleSetWelcome(), { renderWelcomeTemplate }, stateManager (+11 more)

### Community 11 - "registry.js"
Cohesion: 0.12
Nodes (16): { handleAsknow }, { handleHelp }, { handleKnowledge }, { handleLeaderboard }, { handleMilestones }, { handlePoints }, { handlePostdaily }, { handleRank } (+8 more)

### Community 12 - "OWGT Bot"
Cohesion: 0.22
Nodes (8): Administrator commands, Invite rewards 👋, Knowledge topics, Leaderboard 🏆, Overview, OWGT Bot, Reliability, User commands

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

### Community 20 - "leaderboard.js"
Cohesion: 0.50
Nodes (4): { createLeaderboardEmbed }, handleLeaderboard(), stateManager, createLeaderboardEmbed()

### Community 21 - "interaction.js"
Cohesion: 0.40
Nodes (4): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, dbOperations, { registry }, stateManager

### Community 22 - "knowledge.js"
Cohesion: 0.50
Nodes (3): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager

### Community 23 - "setcc.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetCC(), stateManager

### Community 24 - "setinvitepoints.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetInvitePoints(), stateManager

## Knowledge Gaps
- **283 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+278 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `log()` connect `index.js` to `ready.js`, `posting.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _283 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `posting.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._
- **Should `resolve.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06976744186046512 - nodes in this community are weakly interconnected._
- **Should `operations.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07681365576102418 - nodes in this community are weakly interconnected._
- **Should `message.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11333333333333333 - nodes in this community are weakly interconnected._