# Graph Report - discord-poll-bot  (2026-09-12)

## Corpus Check
- 54 files · ~17,156 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 365 nodes · 609 edges · 18 communities
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84b7f12c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- interaction.js
- generation.js
- posting.js
- resolve.js
- operations.js
- message.js
- package.json
- index.js
- validate.js
- ready.js
- startup.js
- engagement.js
- OWGT Bot
- Database runbook
- ai/client.js
- migrate-test.js
- config/index.js

## God Nodes (most connected - your core abstractions)
1. `handleInteractionCreate()` - 17 edges
2. `log()` - 11 edges
3. `handleMessageCreate()` - 10 edges
4. `handleReady()` - 10 edges
5. `generateTextWithOpenRouter()` - 10 edges
6. `sortRows()` - 9 edges
7. `generateTriviaPollWithOpenRouter()` - 8 edges
8. `performDailyPost()` - 8 edges
9. `startBot()` - 8 edges
10. `OWGT Bot` - 8 edges

## Surprising Connections (you probably didn't know these)
- `handleInteractionCreate()` --calls--> `handleAsknow()`  [EXTRACTED]
  handlers/interaction.js → commands/admin/asknow.js
- `handleInteractionCreate()` --calls--> `handleMilestones()`  [EXTRACTED]
  handlers/interaction.js → commands/admin/milestones.js
- `handleInteractionCreate()` --calls--> `handlePoints()`  [EXTRACTED]
  handlers/interaction.js → commands/admin/points.js
- `handleInteractionCreate()` --calls--> `handlePostdaily()`  [EXTRACTED]
  handlers/interaction.js → commands/admin/postdaily.js
- `handleInteractionCreate()` --calls--> `handleRelinkpoll()`  [EXTRACTED]
  handlers/interaction.js → commands/admin/relinkpoll.js

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "interaction.js"
Cohesion: 0.05
Nodes (46): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, handleSetCC(), stateManager, dbOperations, handleSetControlRole() (+38 more)

### Community 1 - "generation.js"
Cohesion: 0.09
Nodes (33): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, callWithRetries(), circuitBreakers, convQueue, { generateTextWithOpenRouter } (+25 more)

### Community 2 - "posting.js"
Cohesion: 0.07
Nodes (28): handlePostdaily(), { performDailyPost }, dbOperations, { EmbedBuilder }, { generateTextWithRetries }, handleRelinkpoll(), stateManager, generateTextWithRetries() (+20 more)

### Community 3 - "resolve.js"
Cohesion: 0.10
Nodes (24): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+16 more)

### Community 4 - "operations.js"
Cohesion: 0.11
Nodes (11): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+3 more)

### Community 5 - "message.js"
Cohesion: 0.12
Nodes (23): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+15 more)

### Community 6 - "package.json"
Cohesion: 0.09
Nodes (21): @google/genai, node-cron, dependencies, discord.js, @google/genai, node-cron, pg, description (+13 more)

### Community 7 - "index.js"
Cohesion: 0.12
Nodes (19): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleGuildMemberAdd(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool (+11 more)

### Community 8 - "validate.js"
Cohesion: 0.18
Nodes (18): crypto, fs, { KNOWN_TABLES, sortRows, hashSnapshot }, main(), { Pool }, fs, { KNOWN_TABLES, sortRows, stableStringify }, main() (+10 more)

### Community 9 - "ready.js"
Cohesion: 0.11
Nodes (18): commands, { DISCORD_BOT_TOKEN }, rest, { SlashCommandBuilder, Routes, REST }, { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls }, { commands, rest } (+10 more)

### Community 10 - "startup.js"
Cohesion: 0.20
Nodes (14): applyNetworkDefaults(), validateConfig(), initializeDatabase(), { log }, pool, handleReady(), main(), log() (+6 more)

### Community 11 - "engagement.js"
Cohesion: 0.23
Nodes (12): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+4 more)

### Community 12 - "OWGT Bot"
Cohesion: 0.22
Nodes (8): Administrator commands, Invite rewards, Knowledge topics, Leaderboard, Overview, OWGT Bot, Reliability, User commands

### Community 13 - "Database runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 14 - "ai/client.js"
Cohesion: 0.25
Nodes (6): ai, { Client, GatewayIntentBits }, discordClient, { GEMINI_API_KEY }, { GoogleGenAI }, { log }

### Community 15 - "migrate-test.js"
Cohesion: 0.40
Nodes (5): fs, listMigrations(), main(), path, { Pool }

### Community 16 - "config/index.js"
Cohesion: 0.50
Nodes (3): getSanitizedDbUrl(), { getSanitizedDbUrl }, { Pool }

## Knowledge Gaps
- **192 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `log()` connect `startup.js` to `ready.js`, `ai/client.js`, `index.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `handleInteractionCreate()` connect `interaction.js` to `generation.js`, `posting.js`, `resolve.js`, `index.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `generateTextWithOpenRouter()` connect `generation.js` to `posting.js`, `message.js`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `interaction.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05021173623714459 - nodes in this community are weakly interconnected._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._
- **Should `posting.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0748663101604278 - nodes in this community are weakly interconnected._