# Welcome Message Settings

> 8 nodes

## Key Concepts

- **setwelcome.js** (9 connections) — `commands/admin/setwelcome.js`
- **renderWelcomeTemplate()** (7 connections) — `lib/serviceHelpers.js`
- **handleSettings()** (3 connections) — `commands/admin/settings.js`
- **handleSetWelcome()** (3 connections) — `commands/admin/setwelcome.js`
- **handleGuildMemberAdd()** (3 connections) — `handlers/invites.js`
- **dbOperations** (1 connections) — `commands/admin/setwelcome.js`
- **{ renderWelcomeTemplate }** (1 connections) — `commands/admin/setwelcome.js`
- **stateManager** (1 connections) — `commands/admin/setwelcome.js`

## Relationships

- [Command Registry & User Rank](Command_Registry_&_User_Rank.md) (3 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (2 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (2 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (2 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (1 shared connections)
- [State Manager & Knowledge Commands](State_Manager_&_Knowledge_Commands.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)

## Source Files

- `commands/admin/settings.js`
- `commands/admin/setwelcome.js`
- `handlers/invites.js`
- `lib/serviceHelpers.js`

## Audit Trail

- EXTRACTED: 16 (80%)
- INFERRED: 4 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*