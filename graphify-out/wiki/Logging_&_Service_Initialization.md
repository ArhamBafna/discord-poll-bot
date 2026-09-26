# Logging & Service Initialization

> 14 nodes

## Key Concepts

- **log()** (13 connections) — `utils/logger.js`
- **handleReady()** (10 connections) — `handlers/ready.js`
- **ai/client.js** (10 connections) — `services/ai/client.js`
- **initialization.js** (7 connections) — `database/initialization.js`
- **logger.js** (6 connections) — `utils/logger.js`
- **initializeDatabase()** (4 connections) — `database/initialization.js`
- **main()** (3 connections) — `index.js`
- **@google/genai** (3 connections) — `package.json`
- **{ log }** (1 connections) — `database/initialization.js`
- **pool** (1 connections) — `database/initialization.js`
- **{ GEMINI_API_KEY }** (1 connections) — `services/ai/client.js`
- **{ GoogleGenAI }** (1 connections) — `services/ai/client.js`
- **{ log }** (1 connections) — `services/ai/client.js`
- **config_index_gemini_api_key** (1 connections)

## Relationships

- [Bot Ready & Command Definitions](Bot_Ready_&_Command_Definitions.md) (5 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (5 shared connections)
- [Bot Startup & Config Validation](Bot_Startup_&_Config_Validation.md) (5 shared connections)
- [Daily Poll Posting & Scheduling](Daily_Poll_Posting_&_Scheduling.md) (2 shared connections)
- [Config & DB Connection](Config_&_DB_Connection.md) (2 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (2 shared connections)
- [Admin Roles, Milestones & Points](Admin_Roles,_Milestones_&_Points.md) (1 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (1 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (1 shared connections)
- [Engagement Posts](Engagement_Posts.md) (1 shared connections)
- [Project Dependencies & Scripts](Project_Dependencies_&_Scripts.md) (1 shared connections)

## Source Files

- `database/initialization.js`
- `handlers/ready.js`
- `index.js`
- `package.json`
- `services/ai/client.js`
- `utils/logger.js`

## Audit Trail

- EXTRACTED: 41 (93%)
- INFERRED: 3 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*