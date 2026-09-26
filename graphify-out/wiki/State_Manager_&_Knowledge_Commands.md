# State Manager & Knowledge Commands

> 11 nodes

## Key Concepts

- **manager.js** (25 connections) — `state/manager.js`
- **knowledge.js** (6 connections) — `commands/admin/knowledge.js`
- **setcontrolrole.js** (6 connections) — `commands/admin/setcontrolrole.js`
- **handleKnowledge()** (3 connections) — `commands/admin/knowledge.js`
- **handleSetControlRole()** (2 connections) — `commands/admin/setcontrolrole.js`
- **getServerState()** (1 connections) — `state/manager.js`
- **{ ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle }** (1 connections) — `commands/admin/knowledge.js`
- **stateManager** (1 connections) — `commands/admin/knowledge.js`
- **dbOperations** (1 connections) — `commands/admin/setcontrolrole.js`
- **stateManager** (1 connections) — `commands/admin/setcontrolrole.js`
- **serverStateCache** (1 connections) — `state/manager.js`

## Relationships

- [Command Registry & User Rank](Command_Registry_&_User_Rank.md) (5 shared connections)
- [Embeds, Polls & Leaderboard](Embeds,_Polls_&_Leaderboard.md) (4 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (3 shared connections)
- [Admin Roles, Milestones & Points](Admin_Roles,_Milestones_&_Points.md) (3 shared connections)
- [Interaction Handling & Help](Interaction_Handling_&_Help.md) (2 shared connections)
- [Daily Poll Posting & Scheduling](Daily_Poll_Posting_&_Scheduling.md) (2 shared connections)
- [Bot Entry Point & Clients](Bot_Entry_Point_&_Clients.md) (1 shared connections)
- [AI Poll & Text Generation](AI_Poll_&_Text_Generation.md) (1 shared connections)
- [SetCC Command](SetCC_Command.md) (1 shared connections)
- [SetInvitePoints Command](SetInvitePoints_Command.md) (1 shared connections)
- [Welcome Message Settings](Welcome_Message_Settings.md) (1 shared connections)
- [Invite Tracking & Guild Events](Invite_Tracking_&_Guild_Events.md) (1 shared connections)

## Source Files

- `commands/admin/knowledge.js`
- `commands/admin/setcontrolrole.js`
- `state/manager.js`

## Audit Trail

- EXTRACTED: 35 (92%)
- INFERRED: 3 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*