# Graph Report - discord-poll-bot  (2026-09-25)

## Corpus Check
- 68 files · ~58,142 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 584 nodes · 962 edges · 38 communities (35 shown, 3 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98368f8f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Poll Embed Card
- generation.js
- interaction.js
- Settings Codec Serialization
- posting.js
- db-init.test.js
- Agent skills
- registry.js
- message.js
- package.json
- ready.js
- backup.test.js
- startup.js
- embeds.js
- ExpiringMap
- tables.test.js
- invites.js
- index.js
- admin/milestones.js
- Discord AI Poll Bot
- validate.js
- backup.js
- engagement.js
- setcc.js
- Database runbook
- Database Backup and Restore Runbook
- Neural Wireframe Brain Glyph
- config/index.js
- migrate-test.js
- Issue tracker: GitHub
- log
- Domain Docs
- manager.js
- idx_question_history_guild_created
- 002_merge_state_knowledge.sql
- Current Live Production Status
- setinvitepoints.js

## God Nodes (most connected - your core abstractions)
1. `log()` - 13 edges
2. `stableStringify()` - 11 edges
3. `sortRows()` - 11 edges
4. `hashSnapshot()` - 11 edges
5. `handleMessageCreate()` - 10 edges
6. `handleReady()` - 10 edges
7. `generateTextWithOpenRouter()` - 10 edges
8. `Poll Embed Card` - 10 edges
9. `ExpiringMap` - 9 edges
10. `discord.js` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Neon Neural Brain Logo` --conceptually_related_to--> `Discord AI Poll Bot`  [INFERRED]
  assets/logo.png → README.md
- `handleReady()` --calls--> `checkAndPostEngagement()`  [EXTRACTED]
  handlers/ready.js → services/engagement.js
- `handleReady()` --calls--> `cacheAndSyncInvites()`  [EXTRACTED]
  handlers/ready.js → services/invites/tracking.js
- `handleReady()` --calls--> `postWeeklySummary()`  [EXTRACTED]
  handlers/ready.js → services/polls/posting.js
- `handleReady()` --calls--> `runCentralizedDailyPost()`  [EXTRACTED]
  handlers/ready.js → services/polls/posting.js

## Import Cycles
- 2-file cycle: `commands/registry.js -> commands/user/help.js -> commands/registry.js`

## Hyperedges (group relationships)
- **Logo Brand Mark Composition** — assets_logo, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_rounded_app_icon_tile, assets_logo_magenta_cyan_neon_palette [EXTRACTED 1.00]
- **Poll Answering Interaction** — assets_discord_bot_eg_poll_embed, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_percentage_bar, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button, assets_discord_bot_eg_poll_footer_meta [EXTRACTED 1.00]
- **Post-Poll Resolution Flow** — assets_discord_bot_eg_previous_poll_answer_card, assets_discord_bot_eg_correct_answer_reveal, assets_discord_bot_eg_answer_explanation, assets_discord_bot_eg_leaderboard_update, assets_discord_bot_eg_points_award [EXTRACTED 1.00]
- **Neon Cyberpunk Visual Language** — assets_logo_magenta_cyan_neon_palette, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_dark_navy_backdrop [INFERRED 0.75]
- **Bot Visual Branding** — assets_logo_neural_brain_icon, assets_logo_app_icon, assets_logo_neon_gradient, assets_discord_bot_eg_owgt_bot [INFERRED 0.85]
- **Single-Select Poll Mechanics** — assets_discord_bot_eg_selection_enforcement, assets_discord_bot_eg_poll_question, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button [INFERRED 0.85]

## Communities (38 total, 3 thin omitted)

### Community 0 - "Poll Embed Card"
Cohesion: 0.13
Nodes (28): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, OWGT Bot Discord Screenshot, Button-Style Poll Options, Correct Answer Reveal, Today's AI Poll Command Message, Discord Dark Theme Styling, Discord Embed Card Chrome (Accent Bar, Rounded Surface) (+20 more)

### Community 1 - "generation.js"
Cohesion: 0.06
Nodes (49): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, config_index_openrouter_api_key, callWithRetries(), circuitBreakers, convQueue (+41 more)

### Community 2 - "interaction.js"
Cohesion: 0.14
Nodes (15): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { renderWelcomeTemplate }, stateManager, registry, { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { createInfoEmbed }, handleHelp(), config_index_allowed_username (+7 more)

### Community 3 - "Settings Codec Serialization"
Cohesion: 0.08
Nodes (18): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+10 more)

### Community 4 - "posting.js"
Cohesion: 0.12
Nodes (24): config_index_target_channel_ids, { createLeaderboardEmbed }, dbOperations, { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }, { generateTextWithRetries }, { generateTriviaPoll, generateDiscussionPoll }, { getNYDateString, getNYWeekString }, getOrGenerateDailyPoll() (+16 more)

### Community 5 - "db-init.test.js"
Cohesion: 0.06
Nodes (28): ref_node_assert, assert, config, assert, backupSource, codecSource, fs, initSource (+20 more)

### Community 6 - "Agent skills"
Cohesion: 0.67
Nodes (3): Agent skills, Domain docs, Issue tracker

### Community 7 - "registry.js"
Cohesion: 0.11
Nodes (17): { handleAsknow }, { handleHelp }, { handleKnowledge }, { handleLeaderboard }, { handleMilestones }, { handlePoints }, { handleRank }, { handleRelinkpoll } (+9 more)

### Community 8 - "message.js"
Cohesion: 0.11
Nodes (24): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+16 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron, pg, ws, description (+14 more)

### Community 10 - "ready.js"
Cohesion: 0.10
Nodes (20): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, config_index_discord_bot_token, { cacheAndSyncInvites }, { checkAndPostEngagement } (+12 more)

### Community 11 - "backup.test.js"
Cohesion: 0.11
Nodes (18): ref_os, assert, crypto, fileA, fileB, fileC, fs, original (+10 more)

### Community 12 - "startup.js"
Cohesion: 0.18
Nodes (14): applyNetworkDefaults(), validateConfig(), main(), ref_dns, ref_https, assert, { startBot, loginWithTimeout }, { testDiscordGateway } (+6 more)

### Community 13 - "embeds.js"
Cohesion: 0.08
Nodes (32): dbOperations, { EmbedBuilder }, { generateTextWithRetries }, handleRelinkpoll(), { replySuccess, replyError }, stateManager, { createSuccessEmbed }, dbOperations (+24 more)

### Community 14 - "ExpiringMap"
Cohesion: 0.14
Nodes (7): ExpiringMap, ref_node_test, ref_node_timers, assert, ExpiringMap, { setTimeout }, test

### Community 15 - "tables.test.js"
Cohesion: 0.12
Nodes (15): a, assert, b, c, crypto, h1, h2, h3 (+7 more)

### Community 16 - "invites.js"
Cohesion: 0.18
Nodes (12): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate }, stateManager (+4 more)

### Community 17 - "index.js"
Cohesion: 0.14
Nodes (13): ai, { Client, GatewayIntentBits }, discordClient, handleInviteCreate(), discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate } (+5 more)

### Community 18 - "admin/milestones.js"
Cohesion: 0.20
Nodes (11): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+3 more)

### Community 19 - "Discord AI Poll Bot"
Cohesion: 0.18
Nodes (10): Rounded Square App Icon Frame, Neon Purple-Cyan Gradient, Neon Neural Brain Logo, Glowing Neural Network Graph, Commands, Discord AI Poll Bot, Features, How it works (+2 more)

### Community 20 - "validate.js"
Cohesion: 0.24
Nodes (13): ref_crypto, makeSnapshot(), runValidate(), main(), main(), hashSnapshot(), sortRows(), stableStringify() (+5 more)

### Community 21 - "backup.js"
Cohesion: 0.21
Nodes (9): pg, crypto, fs, { KNOWN_TABLES, sortRows, hashSnapshot }, { Pool }, fs, { KNOWN_TABLES, sortRows, stableStringify }, { Pool } (+1 more)

### Community 22 - "engagement.js"
Cohesion: 0.23
Nodes (12): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+4 more)

### Community 23 - "setcc.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetCC(), stateManager

### Community 24 - "Database runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 25 - "Database Backup and Restore Runbook"
Cohesion: 0.29
Nodes (7): handleSettings(), dbOperations, handleSetWelcome(), { renderWelcomeTemplate }, stateManager, handleGuildMemberAdd(), renderWelcomeTemplate()

### Community 26 - "Neural Wireframe Brain Glyph"
Cohesion: 0.36
Nodes (8): Poll Bot Logo, Cerebellum and Brain Stem Detail, Collective Intelligence Design Intent, Connected Node Dots and Edges Mesh, Dark Navy Backdrop, Magenta to Cyan Neon Gradient Palette, Neural Wireframe Brain Glyph, Rounded Square App Icon Tile

### Community 27 - "config/index.js"
Cohesion: 0.50
Nodes (3): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }

### Community 28 - "migrate-test.js"
Cohesion: 0.29
Nodes (7): ref_fs, ref_path, fs, listMigrations(), main(), path, { Pool }

### Community 29 - "Issue tracker: GitHub"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 30 - "log"
Cohesion: 0.21
Nodes (10): config_index_gemini_api_key, initializeDatabase(), { log }, pool, handleReady(), @google/genai, { GEMINI_API_KEY }, { GoogleGenAI } (+2 more)

### Community 31 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 32 - "manager.js"
Cohesion: 0.18
Nodes (7): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, handleSetControlRole(), stateManager, serverStateCache

### Community 36 - "Current Live Production Status"
Cohesion: 0.40
Nodes (4): Archive / Legacy: HeavenCloud Notes & Past Fixes, Current Live Production Status, Current Live Production Status, Server Management Quick Reference

### Community 37 - "setinvitepoints.js"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetInvitePoints(), stateManager

## Ambiguous Edges - Review These
- `AI/ML Tech Trivia Question Domain` → `OWGT Bot Identity`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **297 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+292 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 338 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `AI/ML Tech Trivia Question Domain` and `OWGT Bot Identity`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `pg` connect `backup.js` to `package.json`, `config/index.js`, `migrate-test.js`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `discord.js` connect `index.js` to `manager.js`, `registry.js`, `package.json`, `ready.js`, `embeds.js`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _297 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Poll Embed Card` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06203007518796992 - nodes in this community are weakly interconnected._