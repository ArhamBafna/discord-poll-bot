# Graph Report - discord-poll-bot  (2026-09-27)

## Corpus Check
- 72 files · ~32,113 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 689 nodes · 1071 edges · 52 communities (35 shown, 17 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2352d0de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Poll Embeds & Gamification
- generation.js
- config.js
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
- config/index.js
- log
- index.js
- ref_node_assert
- Discord AI Poll Bot
- registry.js
- definitions.js
- engagement.js
- Current Live Production Status
- Database Runbook
- manager.js
- commands-registry.test.js
- catch-up.test.js
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_posting_getorgeneratedailypoll
- Issue tracker: GitHub
- interaction.js
- Domain Docs
- Deploy Bot
- Question History Index
- Knowledge State Migration
- handleReady
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_definitions_commands
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_definitions_rest
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_codecs
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_issettingskey
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_parsestoredvalue
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_codecs_serializestoredvalue
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_database_initialization_initializedatabase
- scheduling.js
- applyPollMention
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_engagement_checkandpostengagement
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_invites_tracking_cacheandsyncinvites
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_posting_performdailypost
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_scheduling_checkformissedpolls
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_roles_milestones_syncallmilestoneroles
- c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_logger_log

## God Nodes (most connected - your core abstractions)
1. `log()` - 13 edges
2. `hashSnapshot()` - 11 edges
3. `sortRows()` - 11 edges
4. `stableStringify()` - 11 edges
5. `handleConfig()` - 10 edges
6. `generateTextWithOpenRouter()` - 10 edges
7. `handleReady()` - 10 edges
8. `handleMessageCreate()` - 10 edges
9. `discord.js` - 10 edges
10. `Poll Embed Card` - 10 edges

## Surprising Connections (you probably didn't know these)
- `resolveDaily()` --calls--> `resolveLastPoll()`  [EXTRACTED]
  commands/admin/poll.js → services/polls/resolution.js
- `handleAsk()` --calls--> `applyPollMention()`  [EXTRACTED]
  commands/admin/poll.js → lib/mentions.js
- `handleAsk()` --calls--> `resolvePollMention()`  [EXTRACTED]
  commands/admin/poll.js → lib/mentions.js
- `handleAsk()` --calls--> `generateTriviaPoll()`  [EXTRACTED]
  commands/admin/poll.js → services/ai/generation.js
- `handleRelink()` --calls--> `generateTextWithRetries()`  [EXTRACTED]
  commands/admin/poll.js → services/ai/generation.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Poll Answering Interaction** — assets_discord_bot_eg_poll_embed, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_percentage_bar, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button, assets_discord_bot_eg_poll_footer_meta [EXTRACTED 1.00]
- **Post-Poll Resolution Flow** — assets_discord_bot_eg_previous_poll_answer_card, assets_discord_bot_eg_correct_answer_reveal, assets_discord_bot_eg_answer_explanation, assets_discord_bot_eg_leaderboard_update, assets_discord_bot_eg_points_award [EXTRACTED 1.00]
- **Single-Select Poll Mechanics** — assets_discord_bot_eg_selection_enforcement, assets_discord_bot_eg_poll_question, assets_discord_bot_eg_poll_option_rows, assets_discord_bot_eg_your_vote_state, assets_discord_bot_eg_remove_vote_button [INFERRED 0.85]

## Communities (52 total, 17 thin omitted)

### Community 0 - "Poll Embeds & Gamification"
Cohesion: 0.13
Nodes (28): AI/ML Tech Trivia Question Domain, Poll Answer Explanation Block, OWGT Bot Discord Screenshot, Button-Style Poll Options, Correct Answer Reveal, Today's AI Poll Command Message, Discord Dark Theme Styling, Discord Embed Card Chrome (Accent Bar, Rounded Surface) (+20 more)

### Community 1 - "generation.js"
Cohesion: 0.07
Nodes (45): config_index_openrouter_api_key, callWithRetries(), circuitBreakers, convQueue, { generateTextWithOpenRouter }, isRetryableError(), metrics, processConvQueue() (+37 more)

### Community 2 - "config.js"
Cohesion: 0.08
Nodes (32): c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_config_index_allowed_username, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_config_index_control_role_name, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_servicehelpers_renderwelcometemplate, { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, dbOperations, handleCC(), handleConfig(), handleInvitePoints() (+24 more)

### Community 3 - "operations.js"
Cohesion: 0.07
Nodes (20): CODECS, isSettingsKey(), parseStoredValue(), serializeStoredValue(), { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue }, getStateValue(), loadStateForGuild(), pool (+12 more)

### Community 4 - "posting.js"
Cohesion: 0.09
Nodes (21): c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_config_index_target_channel_ids, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_embeds_createleaderboardembed, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatediscussionpoll, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_fallbacks_fallback_discussion_polls, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_fallbacks_fallback_polls, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_dateutils_getnydatestring, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_utils_dateutils_getnyweekstring, { applyPollMention, resolvePollMention } (+13 more)

### Community 5 - "db-init.test.js"
Cohesion: 0.09
Nodes (21): ref_path, assert, backupSource, codecSource, fs, initSource, migrateTestSource, migration1Source (+13 more)

### Community 6 - "Agent Skills & Docs"
Cohesion: 0.67
Nodes (3): Agent skills, Domain docs, Issue tracker

### Community 7 - "commands-help.test.js"
Cohesion: 0.14
Nodes (13): c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_user_help_buildhelpembed, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_user_help_formatcommandhelp, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_user_help_handlehelp, assert, { buildHelpEmbed, formatCommandHelp, handleHelp }, configValue, deprecatedCommands, embed (+5 more)

### Community 8 - "Message Handling & AI Sessions"
Cohesion: 0.11
Nodes (24): activeUserSessions, { ALLOWED_USERNAME }, BROAD_KEYWORDS, buildAiContents(), { buildConversationHistory, generateChatResponseWithRetries }, channelOverloadState, computeProactiveRelevanceScore(), dbOperations (+16 more)

### Community 9 - "package.json"
Cohesion: 0.07
Nodes (26): getSanitizedDbUrl(), dbUrl, { getSanitizedDbUrl }, dependencies, discord.js, @google/genai, @neondatabase/serverless, node-cron (+18 more)

### Community 10 - "ready.js"
Cohesion: 0.13
Nodes (14): { cacheAndSyncInvites }, { checkAndPostEngagement }, { checkForMissedPolls }, { commands, rest }, cron, dbOperations, { initializeDatabase }, { log } (+6 more)

### Community 11 - "backup.test.js"
Cohesion: 0.05
Nodes (56): ref_crypto, ref_fs, ref_os, pg, assert, crypto, fileA, fileB (+48 more)

### Community 12 - "invites.js"
Cohesion: 0.16
Nodes (13): { ALLOWED_USERNAME }, dbOperations, handleGuildCreate(), handleInviteCreate(), handleInviteDelete(), { inviteCache, cacheAndSyncInvites }, pool, { renderWelcomeTemplate } (+5 more)

### Community 13 - "poll.js"
Cohesion: 0.06
Nodes (42): c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_embeds_createsuccessembed, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_embeds_replyerror, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_lib_embeds_replysuccess, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatetextwithretries, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_ai_generation_generatetriviapoll, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_services_polls_resolution_resolvelastpoll, { applyPollMention, resolvePollMention }, { createSuccessEmbed, replySuccess, replyError } (+34 more)

### Community 14 - "ExpiringMap"
Cohesion: 0.14
Nodes (7): ExpiringMap, ref_node_test, ref_node_timers, assert, ExpiringMap, { setTimeout }, test

### Community 15 - "config/index.js"
Cohesion: 0.18
Nodes (14): applyNetworkDefaults(), validateConfig(), main(), ref_dns, ref_https, assert, { startBot, loginWithTimeout }, { testDiscordGateway } (+6 more)

### Community 16 - "log"
Cohesion: 0.21
Nodes (9): config_index_gemini_api_key, initializeDatabase(), { log }, pool, @google/genai, { GEMINI_API_KEY }, { GoogleGenAI }, { log } (+1 more)

### Community 17 - "index.js"
Cohesion: 0.15
Nodes (12): ai, { Client, GatewayIntentBits }, discordClient, discordClient, { Events }, { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd }, { handleInteractionCreate }, { handleMessageCreate } (+4 more)

### Community 18 - "ref_node_assert"
Cohesion: 0.07
Nodes (25): ref_node_assert, assert, config, assert, codecs, doubleParsed, knownSettingsKeys, numericKnowledge (+17 more)

### Community 19 - "Discord AI Poll Bot"
Cohesion: 0.29
Nodes (6): Commands, Discord AI Poll Bot, Features, How it works, Other, Quick start / Local setup

### Community 20 - "registry.js"
Cohesion: 0.12
Nodes (15): c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_admin_knowledge_handleknowledge, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_admin_milestones_handlemilestones, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_admin_points_handlepoints, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_user_leaderboard_handleleaderboard, c_users_bafna_sb19qr0_desktop_projects_discord_poll_bot_commands_user_rank_handlerank, { handleConfig }, { handleHelp }, { handleKnowledge } (+7 more)

### Community 21 - "definitions.js"
Cohesion: 0.25
Nodes (7): commands, { DISCORD_BOT_TOKEN }, { registry }, rest, { REST, Routes }, registry, config_index_discord_bot_token

### Community 22 - "engagement.js"
Cohesion: 0.15
Nodes (18): ADMIN_CHANNEL_NAMES, ADMIN_COMMANDS, checkAndPostEngagement(), COMMAND_DESCRIPTIONS, dbOperations, findEngagementChannels(), getOrderedWritableChannels(), isWritableTextChannel() (+10 more)

### Community 23 - "Current Live Production Status"
Cohesion: 0.33
Nodes (5): Archive / Legacy: HeavenCloud Notes & Past Fixes, Current Live Production Status, Current Live Production Status, Server Management Quick Reference, Troubleshooting: SSH Connects Then Disconnects Instantly

### Community 24 - "Database Runbook"
Cohesion: 0.22
Nodes (8): 1. Back up the live database, 2. Make a copy database, 3. Copy live data into the test copy, 4. Test the change on the copy first, 5. Check the copy still holds the same data, 6. Apply to live, Database runbook, Proof the backup works

### Community 25 - "manager.js"
Cohesion: 0.09
Nodes (22): handleKnowledge(), { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }, stateManager, dbOperations, handleMilestones(), stateManager, { syncAllMilestoneRoles }, { checkAndAssignMilestoneRole } (+14 more)

### Community 26 - "commands-registry.test.js"
Cohesion: 0.14
Nodes (13): assert, configCmd, configJson, configSubcommands, deprecatedNames, mentionMode, mentionRole, mentionSub (+5 more)

### Community 27 - "catch-up.test.js"
Cohesion: 0.20
Nodes (6): assert, { checkForMissedPolls }, dbOperations, fakeClient, posting, stateManager

### Community 29 - "Issue tracker: GitHub"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 30 - "interaction.js"
Cohesion: 0.25
Nodes (7): config_index_allowed_username, config_index_control_role_name, { ALLOWED_USERNAME, CONTROL_ROLE_NAME }, dbOperations, handleInteractionCreate(), { registry }, stateManager

### Community 31 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 32 - "Deploy Bot"
Cohesion: 0.25
Nodes (7): Anti-Patterns (NEVER Do), Deploy Bot, Deployment Steps, Host Details, Pre-flight Check, Report Format, Troubleshooting

### Community 36 - "handleReady"
Cohesion: 0.46
Nodes (7): handleReady(), getOrGenerateDailyPoll(), performDailyPost(), runCentralizedDailyPost(), checkForMissedPolls(), getNYDateString(), getNYWeekString()

### Community 44 - "scheduling.js"
Cohesion: 0.29
Nodes (6): config_index_target_channel_ids, dbOperations, { getNYDateString }, { performDailyPost }, stateManager, { TARGET_CHANNEL_IDS }

### Community 45 - "applyPollMention"
Cohesion: 0.50
Nodes (4): applyPollMention(), generateTextWithRetries(), getPollIntroMessage(), postWeeklySummary()

## Ambiguous Edges - Review These
- `AI/ML Tech Trivia Question Domain` → `OWGT Bot Identity`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: conceptually_related_to
- `Correct Answer Reveal` → `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`  [AMBIGUOUS]
  assets/discord-bot-eg.png · relation: references

## Knowledge Gaps
- **345 isolated node(s):** `Quick start / Local setup`, `Features`, `How it works`, `Commands`, `Other` (+340 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 428 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `AI/ML Tech Trivia Question Domain` and `OWGT Bot Identity`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Correct Answer Reveal` and `Poll Vote Tally (CPU 1, GPU 1, RAM 2, SSD 0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `discord.js` connect `index.js` to `config.js`, `package.json`, `ready.js`, `poll.js`, `registry.js`, `definitions.js`, `manager.js`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `pg` connect `backup.test.js` to `package.json`, `db-init.test.js`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Quick start / Local setup`, `Features`, `How it works` to the rest of the system?**
  _345 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Poll Embeds & Gamification` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `generation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07137254901960784 - nodes in this community are weakly interconnected._