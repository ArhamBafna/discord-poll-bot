# Graph Report - discord-poll-bot  (2026-09-25)

## Corpus Check
- 71 files · ~58,305 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 617 nodes · 1037 edges · 36 communities (33 shown, 3 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Discord Poll UI and Embeds
- AskNow AI Poll Generation
- Settings and Welcome Templates
- Settings Codec Serialization
- Daily Post and Fallback Polls
- Config and DB Init Test Fixtures
- Agent Skill and Docs Conventions
- Role and Points Settings
- Message Chat and AI Conversation
- Package Manifest and Dependencies
- Bot Startup and Scheduled Jobs
- Backup Test Fixtures
- Configuration Loading and Validation
- Poll Resolution Modes
- Expiring Map Utility
- Table Sorting Test Fixtures
- Invite Tracking and Cache
- Discord Client and Event Wiring
- Milestone Roles and Points
- Poll Relinking Command
- Backup Validation and Hashing
- Database Backup and Restore
- Engagement Channel Announcements
- Custom Content and Rank Commands
- Production Host and Deployment
- Database Backup and Restore Runbook
- Bot Logo and Brand Identity
- Database Connection and Logging
- Migration Test Runner
- Slash Command Definitions
- Gemini AI Client
- Leaderboard Embed
- Knowledge Base Entry
- Question History Index Migration
- State Knowledge Merge Migration

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
- `Neon Neural Brain Logo` --semantically_similar_to--> `AI Chatbot Conversation Mode`  [INFERRED] [semantically similar]
  assets/logo.png → README.md
- `Weekly Summary (Sunday 9 PM ET)` --semantically_similar_to--> `Leaderboard Update Notice`  [INFERRED] [semantically similar]
  README.md → assets/discord-bot-eg.png
- `Poll Expiry Countdown (8h left)` --conceptually_related_to--> `Daily AI Trivia Poll`  [INFERRED]
  assets/discord-bot-eg.png → README.md
- `OWGT Bot Identity` --conceptually_related_to--> `OWGT (OneWorldGreaterTogether)`  [INFERRED]
  assets/discord-bot-eg.png → README.md
- `Neon Neural Brain Logo` --conceptually_related_to--> `Discord AI Poll Bot`  [INFERRED]
  assets/logo.png → README.md

## Import Cycles
- 2-file cycle: `commands/registry.js -> commands/user/help.js -> commands/registry.js`

## Hyperedges (group relationships)
- **Wayfinder Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_blocking_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Database Migration Safety Flow** — tools_db_runbook_backup_step, tools_db_runbook_copy_database, tools_db_runbook_restore, tools_db_runbook_migrate_test, tools_db_runbook_validate [EXTRACTED 1.00]
- **Poll Answering Interaction** — assets_discord_bot_eg_poll_embed, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_percentage_bar, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button, assets_discord_bot_eg_poll_footer_meta [EXTRACTED 1.00]
- **Post-Poll Resolution Flow** — assets_discord_bot_eg_previous_poll_answer_card, assets_discord_bot_eg_correct_answer_reveal, assets_discord_bot_eg_answer_explanation, assets_discord_bot_eg_leaderboard_update, assets_discord_bot_eg_points_award [EXTRACTED 1.00]
- **Single-Select Poll Mechanics** — assets_discord_bot_eg_selection_enforcement, assets_discord_bot_eg_poll_question, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button [INFERRED 0.85]
- **Bot Visual Branding** — assets_logo_neural_brain_icon, assets_logo_app_icon, assets_logo_neon_gradient, assets_discord_bot_eg_owgt_bot [INFERRED 0.85]
- **Logo Brand Mark Composition** — assets_logo, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_rounded_app_icon_tile, assets_logo_magenta_cyan_neon_palette [EXTRACTED 1.00]
- **Neon Cyberpunk Visual Language** — assets_logo_magenta_cyan_neon_palette, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_dark_navy_backdrop [INFERRED 0.75]

## Communities (36 total, 3 thin omitted)

### Community 0 - "Discord Poll UI and Embeds"
Cohesion: 0.07
Nodes (53): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, OWGT Bot Discord Screenshot, Button-Style Poll Options, Correct Answer Reveal, Today's AI Poll Command Message, Discord Dark Theme Styling, Discord Embed Card Chrome (Accent Bar, Rounded Surface) (+45 more)

### Community 1 - "AskNow AI Poll Generation"
Cohesion: 0.09
Nodes (38): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, config_index_openrouter_api_key, ai, { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }, generateDiscussionPoll() (+30 more)

### Community 2 - "Settings and Welcome Templates"
Cohesion: 0.07
Nodes (31): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, handleSettings(), { renderWelcomeTemplate }, stateManager, dbOperations, handleSetWelcome(), { renderWelcomeTemplate }, stateManager (+23 more)

### Community 3 - "Settings Codec Serialization"
Cohesion: 0.08
Nodes (18): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+10 more)

### Community 4 - "Daily Post and Fallback Polls"
Cohesion: 0.09
Nodes (31): dbOperations, { getNYDateString }, handlePostdaily(), { performDailyPost }, stateManager, config_index_target_channel_ids, FALLBACK_DISCUSSION_POLLS, FALLBACK_POLLS (+23 more)

### Community 5 - "Config and DB Init Test Fixtures"
Cohesion: 0.06
Nodes (28): ref_node_assert, assert, config, assert, backupSource, codecSource, fs, initSource (+20 more)

### Community 6 - "Agent Skill and Docs Conventions"
Cohesion: 0.09
Nodes (25): Agent Skills, Domain Docs Convention (AGENTS.md), GitHub Issues, Issue Tracker Convention (AGENTS.md), ArhamBafna/discord-poll-bot, docs/agents/domain.md, Architecture Decision Records (docs/adr/), ADR Conflict Flagging (+17 more)

### Community 7 - "Role and Points Settings"
Cohesion: 0.09
Nodes (22): dbOperations, handleSetControlRole(), stateManager, dbOperations, handleSetInvitePoints(), stateManager, { handleAsknow }, { handleHelp } (+14 more)

### Community 8 - "Message Chat and AI Conversation"
Cohesion: 0.11
Nodes (24): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+16 more)

### Community 9 - "Package Manifest and Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron, pg, ws, description (+14 more)

### Community 10 - "Bot Startup and Scheduled Jobs"
Cohesion: 0.12
Nodes (18): initializeDatabase(), { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls }, { commands, rest }, cron, dbOperations, handleReady() (+10 more)

### Community 11 - "Backup Test Fixtures"
Cohesion: 0.11
Nodes (18): ref_os, assert, crypto, fileA, fileB, fileC, fs, original (+10 more)

### Community 12 - "Configuration Loading and Validation"
Cohesion: 0.19
Nodes (15): applyNetworkDefaults(), validateConfig(), main(), ref_dns, ref_https, assert, { startBot, loginWithTimeout }, { testDiscordGateway } (+7 more)

### Community 13 - "Poll Resolution Modes"
Cohesion: 0.17
Nodes (15): { createSuccessEmbed }, dbOperations, handleResolve(), normalizeResolveMode(), resolveDaily(), { resolveLastPoll }, resolveOnDemand(), stateManager (+7 more)

### Community 14 - "Expiring Map Utility"
Cohesion: 0.14
Nodes (7): ExpiringMap, ref_node_test, ref_node_timers, assert, ExpiringMap, { setTimeout }, test

### Community 15 - "Table Sorting Test Fixtures"
Cohesion: 0.12
Nodes (15): a, assert, b, c, crypto, h1, h2, h3 (+7 more)

### Community 16 - "Invite Tracking and Cache"
Cohesion: 0.16
Nodes (13): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate } (+5 more)

### Community 17 - "Discord Client and Event Wiring"
Cohesion: 0.15
Nodes (12): ai, { Client, GatewayIntentBits }, discordClient, discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+4 more)

### Community 18 - "Milestone Roles and Points"
Cohesion: 0.20
Nodes (11): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+3 more)

### Community 19 - "Poll Relinking Command"
Cohesion: 0.21
Nodes (12): dbOperations, { EmbedBuilder }, { generateTextWithRetries }, handleRelinkpoll(), { replySuccess, replyError }, stateManager, COLORS, createErrorEmbed() (+4 more)

### Community 20 - "Backup Validation and Hashing"
Cohesion: 0.24
Nodes (13): ref_crypto, makeSnapshot(), runValidate(), main(), main(), hashSnapshot(), sortRows(), stableStringify() (+5 more)

### Community 21 - "Database Backup and Restore"
Cohesion: 0.21
Nodes (9): pg, crypto, fs, { KNOWN_TABLES, sortRows, hashSnapshot }, { Pool }, fs, { KNOWN_TABLES, sortRows, stableStringify }, { Pool } (+1 more)

### Community 22 - "Engagement Channel Announcements"
Cohesion: 0.24
Nodes (11): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel(), pickChannelByNames() (+3 more)

### Community 23 - "Custom Content and Rank Commands"
Cohesion: 0.20
Nodes (6): dbOperations, handleSetCC(), stateManager, handleRank(), stateManager, serverStateCache

### Community 24 - "Production Host and Deployment"
Cohesion: 0.33
Nodes (9): Forward-Slash Path Normalization, Hack Club Nest Production Host, HeavenCloud (Legacy Host), logs.sh Live Log Viewer, Node.js 22 LTS Runtime, SSH Access (arham@hackclub.app), discord-poll-bot.service (systemd), update.sh Deploy Script (+1 more)

### Community 25 - "Database Backup and Restore Runbook"
Cohesion: 0.33
Nodes (9): Neon HTTP Fetch DB Connection, PostgreSQL Leaderboard Store, Backup Restores Same State Proof, Live Database Backup Step, Copy Test Database, Migration Test Against Copy, Never Touch Live Data On Failure, Backup Restore into Copy (+1 more)

### Community 26 - "Bot Logo and Brand Identity"
Cohesion: 0.36
Nodes (8): Poll Bot Logo, Cerebellum and Brain Stem Detail, Collective Intelligence Design Intent, Connected Node Dots and Edges Mesh, Dark Navy Backdrop, Magenta to Cyan Neon Gradient Palette, Neural Wireframe Brain Glyph, Rounded Square App Icon Tile

### Community 27 - "Database Connection and Logging"
Cohesion: 0.25
Nodes (5): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }, { log }, pool

### Community 28 - "Migration Test Runner"
Cohesion: 0.29
Nodes (7): ref_fs, ref_path, fs, listMigrations(), main(), path, { Pool }

### Community 29 - "Slash Command Definitions"
Cohesion: 0.29
Nodes (6): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, config_index_discord_bot_token

### Community 30 - "Gemini AI Client"
Cohesion: 0.33
Nodes (5): config_index_gemini_api_key, @google/genai, { GEMINI_API_KEY }, { GoogleGenAI }, { log }

### Community 31 - "Leaderboard Embed"
Cohesion: 0.50
Nodes (4): { createLeaderboardEmbed }, handleLeaderboard(), stateManager, createLeaderboardEmbed()

### Community 32 - "Knowledge Base Entry"
Cohesion: 0.50
Nodes (3): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager

## Ambiguous Edges - Review These
- `OWGT Bot Identity` → `AI/ML Tech Trivia Question Domain`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **288 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 328 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `OWGT Bot Identity` and `AI/ML Tech Trivia Question Domain`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `pg` connect `Database Backup and Restore` to `Package Manifest and Dependencies`, `Database Connection and Logging`, `Migration Test Runner`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `discord.js` connect `Discord Client and Event Wiring` to `Knowledge Base Entry`, `Role and Points Settings`, `Package Manifest and Dependencies`, `Bot Startup and Scheduled Jobs`, `Poll Relinking Command`, `Slash Command Definitions`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Discord Poll UI and Embeds` be split into smaller, more focused modules?**
  _Cohesion score 0.0660377358490566 - nodes in this community are weakly interconnected._
- **Should `AskNow AI Poll Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._