# Graph Report - discord-poll-bot  (2026-09-25)

## Corpus Check
- 71 files · ~58,305 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 612 nodes · 1031 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Test Fixtures and Node Builtins
- AskNow AI Poll Generation
- Discord Poll UI and Embeds
- Settings Codec Serialization
- Poll Resolution and Relinking
- Daily Post and Fallback Polls
- Message Chat and AI Conversation
- Configuration Loading and Validation
- Bot Startup and Token Config
- Slash Command Registry
- Settings and Help Commands
- Database Init Test Fixtures
- Discord Client and Event Wiring
- Invite Tracking and Welcome
- Milestone Roles and Points
- Database URL and Package Manifest
- Database Init and Gemini Client
- Engagement Channel Announcements
- Issue Tracker Workflow Conventions
- Knowledge Base and Control Role
- Database Operations Tests
- Domain Documentation Conventions
- Production Host and Deployment
- Database Backup and Restore Runbook
- Bot Logo and Brand Identity
- Welcome Message Settings
- Migration Test Runner
- Runtime Package Dependencies
- NPM Script Commands
- Custom CC Setting Command
- Invite Points Setting Command
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
- **Bot Visual Branding** — assets_logo_neural_brain_icon, assets_logo_app_icon, assets_logo_neon_gradient, assets_discord_bot_eg_owgt_bot [INFERRED 0.85]
- **Poll Answering Interaction** — assets_discord_bot_eg_poll_embed, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_percentage_bar, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button, assets_discord_bot_eg_poll_footer_meta [EXTRACTED 1.00]
- **Post-Poll Resolution Flow** — assets_discord_bot_eg_previous_poll_answer_card, assets_discord_bot_eg_correct_answer_reveal, assets_discord_bot_eg_answer_explanation, assets_discord_bot_eg_leaderboard_update, assets_discord_bot_eg_points_award [EXTRACTED 1.00]
- **Single-Select Poll Mechanics** — assets_discord_bot_eg_selection_enforcement, assets_discord_bot_eg_poll_question, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button [INFERRED 0.85]
- **Logo Brand Mark Composition** — assets_logo, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_rounded_app_icon_tile, assets_logo_magenta_cyan_neon_palette [EXTRACTED 1.00]
- **Neon Cyberpunk Visual Language** — assets_logo_magenta_cyan_neon_palette, assets_logo_neural_wireframe_brain, assets_logo_connected_node_glyph, assets_logo_dark_navy_backdrop [INFERRED 0.75]

## Communities (34 total, 3 thin omitted)

### Community 0 - "Test Fixtures and Node Builtins"
Cohesion: 0.05
Nodes (55): ref_crypto, ref_fs, ref_os, assert, crypto, fileA, fileB, fileC (+47 more)

### Community 1 - "AskNow AI Poll Generation"
Cohesion: 0.07
Nodes (47): dbOperations, { generateTriviaPoll }, handleAsknow(), stateManager, config_index_openrouter_api_key, callWithRetries(), circuitBreakers, convQueue (+39 more)

### Community 2 - "Discord Poll UI and Embeds"
Cohesion: 0.07
Nodes (53): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, OWGT Bot Discord Screenshot, Button-Style Poll Options, Correct Answer Reveal, Today's AI Poll Command Message, Discord Dark Theme Styling, Discord Embed Card Chrome (Accent Bar, Rounded Surface) (+45 more)

### Community 3 - "Settings Codec Serialization"
Cohesion: 0.08
Nodes (18): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+10 more)

### Community 4 - "Poll Resolution and Relinking"
Cohesion: 0.08
Nodes (32): dbOperations, { EmbedBuilder }, { generateTextWithRetries }, handleRelinkpoll(), { replySuccess, replyError }, stateManager, { createSuccessEmbed }, dbOperations (+24 more)

### Community 5 - "Daily Post and Fallback Polls"
Cohesion: 0.09
Nodes (31): dbOperations, { getNYDateString }, handlePostdaily(), { performDailyPost }, stateManager, config_index_target_channel_ids, FALLBACK_DISCUSSION_POLLS, FALLBACK_POLLS (+23 more)

### Community 6 - "Message Chat and AI Conversation"
Cohesion: 0.08
Nodes (25): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+17 more)

### Community 7 - "Configuration Loading and Validation"
Cohesion: 0.10
Nodes (22): applyNetworkDefaults(), validateConfig(), ref_dns, ref_https, ref_node_assert, ref_node_test, ref_node_timers, assert (+14 more)

### Community 8 - "Bot Startup and Token Config"
Cohesion: 0.10
Nodes (20): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, config_index_discord_bot_token, { cacheAndSyncInvites }, { checkAndPostEngagement } (+12 more)

### Community 9 - "Slash Command Registry"
Cohesion: 0.11
Nodes (18): { handleAsknow }, { handleHelp }, { handleKnowledge }, { handleLeaderboard }, { handleMilestones }, { handlePoints }, { handlePostdaily }, { handleRank } (+10 more)

### Community 10 - "Settings and Help Commands"
Cohesion: 0.14
Nodes (15): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { renderWelcomeTemplate }, stateManager, registry, { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, { createInfoEmbed }, handleHelp(), config_index_allowed_username (+7 more)

### Community 11 - "Database Init Test Fixtures"
Cohesion: 0.12
Nodes (15): assert, backupSource, codecSource, fs, initSource, migrateTestSource, migration1Source, migration3Source (+7 more)

### Community 12 - "Discord Client and Event Wiring"
Cohesion: 0.14
Nodes (13): ai, { Client, GatewayIntentBits }, discordClient, discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+5 more)

### Community 13 - "Invite Tracking and Welcome"
Cohesion: 0.16
Nodes (13): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate } (+5 more)

### Community 14 - "Milestone Roles and Points"
Cohesion: 0.20
Nodes (11): dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole }, dbOperations, handlePoints(), stateManager (+3 more)

### Community 15 - "Database URL and Package Manifest"
Cohesion: 0.15
Nodes (12): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }, description, engines, node, main, name (+4 more)

### Community 16 - "Database Init and Gemini Client"
Cohesion: 0.21
Nodes (10): config_index_gemini_api_key, initializeDatabase(), { log }, pool, handleReady(), @google/genai, { GEMINI_API_KEY }, { GoogleGenAI } (+2 more)

### Community 17 - "Engagement Channel Announcements"
Cohesion: 0.23
Nodes (12): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+4 more)

### Community 18 - "Issue Tracker Workflow Conventions"
Cohesion: 0.22
Nodes (11): Issue Tracker Convention (AGENTS.md), Native Issue Blocking Dependencies, Ticket Claim (add-assignee @me), Wayfinder Frontier Query, gh CLI (GitHub Issue Tracker), Issue Creation and Lifecycle Conventions, PRs as Triage Surface (disabled), Publish to Issue Tracker Operation (+3 more)

### Community 19 - "Knowledge Base and Control Role"
Cohesion: 0.18
Nodes (7): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, handleSetControlRole(), stateManager, serverStateCache

### Community 20 - "Database Operations Tests"
Cohesion: 0.18
Nodes (10): assert, codecs, doubleParsed, knownSettingsKeys, numericKnowledge, parsed, plain, pollObj (+2 more)

### Community 21 - "Domain Documentation Conventions"
Cohesion: 0.28
Nodes (9): Domain Docs Convention (AGENTS.md), Architecture Decision Records (docs/adr/), ADR Conflict Flagging, CONTEXT-MAP.md, CONTEXT.md, /domain-modeling Skill, Glossary Vocabulary Discipline, Multi-Context Doc Layout (+1 more)

### Community 22 - "Production Host and Deployment"
Cohesion: 0.33
Nodes (9): Forward-Slash Path Normalization, Hack Club Nest Production Host, HeavenCloud (Legacy Host), logs.sh Live Log Viewer, Node.js 22 LTS Runtime, SSH Access (arham@hackclub.app), discord-poll-bot.service (systemd), update.sh Deploy Script (+1 more)

### Community 23 - "Database Backup and Restore Runbook"
Cohesion: 0.33
Nodes (9): Neon HTTP Fetch DB Connection, PostgreSQL Leaderboard Store, Backup Restores Same State Proof, Live Database Backup Step, Copy Test Database, Migration Test Against Copy, Never Touch Live Data On Failure, Backup Restore into Copy (+1 more)

### Community 24 - "Bot Logo and Brand Identity"
Cohesion: 0.36
Nodes (8): Poll Bot Logo, Cerebellum and Brain Stem Detail, Collective Intelligence Design Intent, Connected Node Dots and Edges Mesh, Dark Navy Backdrop, Magenta to Cyan Neon Gradient Palette, Neural Wireframe Brain Glyph, Rounded Square App Icon Tile

### Community 25 - "Welcome Message Settings"
Cohesion: 0.29
Nodes (7): handleSettings(), dbOperations, handleSetWelcome(), { renderWelcomeTemplate }, stateManager, handleGuildMemberAdd(), renderWelcomeTemplate()

### Community 26 - "Migration Test Runner"
Cohesion: 0.29
Nodes (7): ref_path, pg, fs, listMigrations(), main(), path, { Pool }

### Community 27 - "Runtime Package Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron, pg, ws

### Community 28 - "NPM Script Commands"
Cohesion: 0.33
Nodes (6): scripts, db:backup, db:migrate-test, db:restore, db:validate, start

### Community 29 - "Custom CC Setting Command"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetCC(), stateManager

### Community 30 - "Invite Points Setting Command"
Cohesion: 0.50
Nodes (3): dbOperations, handleSetInvitePoints(), stateManager

## Ambiguous Edges - Review These
- `OWGT Bot Identity` → `AI/ML Tech Trivia Question Domain`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **285 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 325 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `OWGT Bot Identity` and `AI/ML Tech Trivia Question Domain`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `pg` connect `Migration Test Runner` to `Test Fixtures and Node Builtins`, `Database URL and Package Manifest`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `discord.js` connect `Discord Client and Event Wiring` to `Poll Resolution and Relinking`, `Bot Startup and Token Config`, `Slash Command Registry`, `Database URL and Package Manifest`, `Knowledge Base and Control Role`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Fixtures and Node Builtins` be split into smaller, more focused modules?**
  _Cohesion score 0.053005464480874315 - nodes in this community are weakly interconnected._
- **Should `AskNow AI Poll Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.06568832983927324 - nodes in this community are weakly interconnected._