# Graph Report - discord-poll-bot  (2026-09-27)

## Corpus Check
- 70 files · ~29,147 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 648 nodes · 1018 edges · 58 communities (32 shown, 26 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36d6aedc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Poll Embeds & Gamification
- generation.js
- manager.js
- operations.js
- posting.js
- db-init.test.js
- Agent Skills & Docs
- commands-help.test.js
- Message Handling & AI Sessions
- package.json
- ready.js
- backup.test.js
- invites.js
- poll.js
- ExpiringMap
- startup.js
- ai/client.js
- index.js
- tables.test.js
- Discord AI Poll Bot
- validate.js
- definitions.js
- engagement.js
- Current Live Production Status
- Database Runbook
- registry.js
- backup.js
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_config_index_target_channel_ids
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_posting_getorgeneratedailypoll
- Issue tracker: GitHub
- config/index.js
- Domain Docs
- Deploy Bot
- Question History Index
- Knowledge State Migration
- migrate-test.js
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_definitions_commands
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_definitions_rest
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_codecs
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_issettingskey
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_parsestoredvalue
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_serializestoredvalue
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_initialization_initializedatabase
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_embeds_createleaderboardembed
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatediscussionpoll
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatetextwithretries
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatetriviapoll
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_engagement_checkandpostengagement
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_invites_tracking_cacheandsyncinvites
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_fallbacks_fallback_discussion_polls
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_fallbacks_fallback_polls
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_posting_performdailypost
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_scheduling_checkformissedpolls
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_roles_milestones_syncallmilestoneroles
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_dateutils_getnydatestring
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_dateutils_getnyweekstring
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_logger_log

## God Nodes (most connected - your core abstractions)
1. `log()` - 13 edges
2. `stableStringify()` - 11 edges
3. `sortRows()` - 11 edges
4. `hashSnapshot()` - 11 edges
5. `handleMessageCreate()` - 10 edges
6. `handleReady()` - 10 edges
7. `generateTextWithOpenRouter()` - 10 edges
8. `Poll Embed Card` - 10 edges
9. `handleConfig()` - 9 edges
10. `ExpiringMap` - 9 edges

## Surprising Connections (you probably didn't know these)
- `handleAsk()` --calls--> `generateTriviaPoll()`  [EXTRACTED]
  commands/admin/poll.js → services/ai/generation.js
- `initializeDatabase()` --calls--> `log()`  [EXTRACTED]
  database/initialization.js → utils/logger.js
- `handleReady()` --calls--> `checkAndPostEngagement()`  [EXTRACTED]
  handlers/ready.js → services/engagement.js
- `handleReady()` --calls--> `cacheAndSyncInvites()`  [EXTRACTED]
  handlers/ready.js → services/invites/tracking.js
- `handleReady()` --calls--> `postWeeklySummary()`  [EXTRACTED]
  handlers/ready.js → services/polls/posting.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Poll Answering Interaction** — assets_discord_bot_eg_poll_embed, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_percentage_bar, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button, assets_discord_bot_eg_poll_footer_meta [EXTRACTED 1.00]
- **Post-Poll Resolution Flow** — assets_discord_bot_eg_previous_poll_answer_card, assets_discord_bot_eg_correct_answer_reveal, assets_discord_bot_eg_answer_explanation, assets_discord_bot_eg_leaderboard_update, assets_discord_bot_eg_points_award [EXTRACTED 1.00]
- **Single-Select Poll Mechanics** — assets_discord_bot_eg_selection_enforcement, assets_discord_bot_eg_poll_question, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button [INFERRED 0.85]

## Communities (58 total, 26 thin omitted)

### Community 0 - "Poll Embeds & Gamification"
Cohesion: 0.13
Nodes (28): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, OWGT Bot Discord Screenshot, Button-Style Poll Options, Correct Answer Reveal, Today's AI Poll Command Message, Discord Dark Theme Styling, Discord Embed Card Chrome (Accent Bar, Rounded Surface) (+20 more)

### Community 1 - "generation.js"
Cohesion: 0.07
Nodes (43): config_index_openrouter_api_key, callWithRetries(), circuitBreakers, convQueue, { generateTextWithOpenRouter }, isRetryableError(), metrics, processConvQueue() (+35 more)

### Community 2 - "manager.js"
Cohesion: 0.09
Nodes (27): { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, dbOperations, handleCC(), handleConfig(), handleInvitePoints(), handleRole(), handleView(), handleWelcome() (+19 more)

### Community 3 - "operations.js"
Cohesion: 0.08
Nodes (18): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+10 more)

### Community 4 - "posting.js"
Cohesion: 0.06
Nodes (42): config_index_target_channel_ids, FALLBACK_DISCUSSION_POLLS, FALLBACK_POLLS, { createLeaderboardEmbed }, dbOperations, { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS }, { generateTextWithRetries }, { generateTriviaPoll, generateDiscussionPoll } (+34 more)

### Community 5 - "db-init.test.js"
Cohesion: 0.06
Nodes (28): ref_node_assert, assert, config, assert, backupSource, codecSource, fs, initSource (+20 more)

### Community 6 - "Agent Skills & Docs"
Cohesion: 0.67
Nodes (3): Agent skills, Domain docs, Issue tracker

### Community 7 - "commands-help.test.js"
Cohesion: 0.16
Nodes (16): buildHelpEmbed(), { createInfoEmbed }, formatCommandHelp(), formatOptionUsage(), handleHelp(), createInfoEmbed(), assert, { buildHelpEmbed, formatCommandHelp, handleHelp } (+8 more)

### Community 8 - "Message Handling & AI Sessions"
Cohesion: 0.11
Nodes (24): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+16 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (23): dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron, pg, ws, description (+15 more)

### Community 10 - "ready.js"
Cohesion: 0.11
Nodes (18): initializeDatabase(), { log }, pool, { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls }, { commands, rest }, cron (+10 more)

### Community 11 - "backup.test.js"
Cohesion: 0.11
Nodes (18): ref_os, assert, crypto, fileA, fileB, fileC, fs, original (+10 more)

### Community 12 - "invites.js"
Cohesion: 0.16
Nodes (13): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate } (+5 more)

### Community 13 - "poll.js"
Cohesion: 0.08
Nodes (37): { createSuccessEmbed, replySuccess, replyError }, dbOperations, { EmbedBuilder }, { generateTriviaPoll, generateTextWithRetries }, handleAsk(), handlePoll(), handleRelink(), handleResolve() (+29 more)

### Community 14 - "ExpiringMap"
Cohesion: 0.14
Nodes (7): ExpiringMap, ref_node_test, ref_node_timers, assert, ExpiringMap, { setTimeout }, test

### Community 15 - "startup.js"
Cohesion: 0.19
Nodes (15): applyNetworkDefaults(), validateConfig(), main(), ref_dns, ref_https, assert, { startBot, loginWithTimeout }, { testDiscordGateway } (+7 more)

### Community 16 - "ai/client.js"
Cohesion: 0.33
Nodes (5): config_index_gemini_api_key, @google/genai, { GEMINI_API_KEY }, { GoogleGenAI }, { log }

### Community 17 - "index.js"
Cohesion: 0.15
Nodes (12): ai, { Client, GatewayIntentBits }, discordClient, discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+4 more)

### Community 18 - "tables.test.js"
Cohesion: 0.12
Nodes (15): a, assert, b, c, crypto, h1, h2, h3 (+7 more)

### Community 19 - "Discord AI Poll Bot"
Cohesion: 0.29
Nodes (6): Commands, Discord AI Poll Bot, Features, How it works, Other, Quick start / Local setup

### Community 20 - "validate.js"
Cohesion: 0.24
Nodes (13): ref_crypto, makeSnapshot(), runValidate(), main(), main(), hashSnapshot(), sortRows(), stableStringify() (+5 more)

### Community 21 - "definitions.js"
Cohesion: 0.25
Nodes (7): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, registry, config_index_discord_bot_token

### Community 22 - "engagement.js"
Cohesion: 0.15
Nodes (18): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+10 more)

### Community 23 - "Current Live Production Status"
Cohesion: 0.40
Nodes (4): Archive / Legacy: HeavenCloud Notes & Past Fixes, Current Live Production Status, Current Live Production Status, Server Management Quick Reference

### Community 24 - "Database Runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 25 - "registry.js"
Cohesion: 0.06
Nodes (35): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole } (+27 more)

### Community 26 - "backup.js"
Cohesion: 0.21
Nodes (9): pg, crypto, fs, { KNOWN_TABLES, sortRows, hashSnapshot }, { Pool }, fs, { KNOWN_TABLES, sortRows, stableStringify }, { Pool } (+1 more)

### Community 29 - "Issue tracker: GitHub"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 30 - "config/index.js"
Cohesion: 0.50
Nodes (3): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }

### Community 31 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 32 - "Deploy Bot"
Cohesion: 0.25
Nodes (7): Anti-Patterns (NEVER Do), Deploy Bot, Deployment Steps, Host Details, Pre-flight Check, Report Format, Troubleshooting

### Community 36 - "migrate-test.js"
Cohesion: 0.29
Nodes (7): ref_fs, ref_path, fs, listMigrations(), main(), path, { Pool }

## Ambiguous Edges - Review These
- `AI/ML Tech Trivia Question Domain` → `OWGT Bot Identity`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **328 isolated node(s):** `{ Client, GatewayIntentBits }`, `ai`, `discordClient`, `stateManager`, `dbOperations` (+323 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 397 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `AI/ML Tech Trivia Question Domain` and `OWGT Bot Identity`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `discord.js` connect `index.js` to `package.json`, `ready.js`, `poll.js`, `definitions.js`, `registry.js`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `pg` connect `backup.js` to `package.json`, `migrate-test.js`, `config/index.js`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `{ Client, GatewayIntentBits }`, `ai`, `discordClient` to the rest of the system?**
  _328 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Poll Embeds & Gamification` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07397959183673469 - nodes in this community are weakly interconnected._