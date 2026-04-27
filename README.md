<div align="center">

# 🤖 <span style="color: #5865F2; font-size: 1.5em; font-weight: bold;">OWGT Bot</span> 🏆

### <span style="color: #57F287;">AI-Powered Poll Bot for Discord</span>

*Enhancing community engagement with daily trivia, AI conversation, and automated leaderboards*

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Leaderboard System](#-the-leaderboard-system-fully-automatic)
- [Invite Rewards](#-bonus-invite-rewards)
- [Reliability Features](#-reliability-features)
- [User Commands](#-user-commands-available-to-everyone)
- [Administrator Commands](#-administrator-commands)
- [Managing the Bot's Knowledge](#-managing-the-bots-knowledge)

---

## 📋 Overview

The **OWGT Bot** is a sophisticated, AI-powered tool designed to enhance community engagement across multiple Discord servers.

It automatically posts a dynamic mix of **daily trivia** and **discussion polls** about Artificial Intelligence.

Key features include a **fully automated leaderboard system**, a **weekly AI-generated performance summary**, a **suite of on-demand commands** for administrators, and **auto-reply behavior** when the bot thinks it should jump into the conversation.

---

## ✨ Core Features

### 📅 Daily Scheduled Polls

- **When:** Every day at **6:00 AM Eastern Time (ET)**.
- **What:** The bot posts a new poll in its designated channel(s).

**Trivia Polls:**
- A multiple-choice question about AI with one correct answer.
- Designed to be fun and educational.
- The bot remembers recent questions to avoid repetition.

### 📢 Automated Answer Reveals & Follow-ups

Right before posting the new daily poll, the bot provides a follow-up to the previous day's trivia poll:

- The bot posts a professional-looking **Embed** that clearly states the correct answer (A, B, C, or D) and provides a detailed, AI-generated explanation.
- It also announces how many members answered correctly and confirms that points have been automatically awarded.

### 🤖 Conversational AI

The bot is not just for polls! You can have a **natural conversation** with it.

**How to Trigger**
- Mention the bot directly (e.g., `@OWGT Bot how are you?`)
- Reply to any of the bot's messages (including polls and answers)

**What it Does**
- Replies in a natural, chat-style way.
- Uses recent conversation context and what it already knows.
- Sometimes auto-replies when it thinks it should jump in.

### 📊 Weekly Leaderboard Summary

- Every **Sunday at 9:00 PM Eastern Time (ET)**, the bot posts a weekly report with a short summary and the **Top 10** members for that server.

---

## 🏅 The Leaderboard System (Fully Automatic!)

### How to Earn Points

- Only the **daily scheduled trivia polls** count towards the leaderboard.
- Discussion polls and on-demand polls **do not** award points.

### How to Claim a Point

The system is **100% automatic.**

1. Simply vote for the correct answer on the Discord poll itself.
2. The poll runs for **24 hours**. When it ends, the bot automatically identifies everyone who voted correctly and adds **1 point** to their score.
3. **No emoji reactions needed** — just vote!

### 🎖️ Role Milestones

The bot automatically rewards top participants with special Discord roles based on their total points.
- **Automated:** Roles are assigned as soon as you hit a point milestone.
- **Progression:** When you hit a higher milestone, your previous milestone role is replaced with the new, more prestigious one.
- **Celebration:** The bot announces your achievement in the channel!

*Score: Each correctly answered daily trivia poll is worth **1 point**. The bot maintains a persistent score for you on each server.*

---

## 🎁 Bonus: Invite Rewards

When someone joins your server via an **invite link**:

- The bot **welcomes them** in the system channel.
- It identifies **who invited them** (when possible).
- **Automatically awards 1 point** to the inviter for each successful invite! 🎉
- If the inviter can't be determined, the bot still welcomes the new member warmly.
- **Customizable:** Administrators can set a custom welcome template and a specific user to CC in the message.

---

## ⚡ Reliability Features

| Feature | Description |
|---------|-------------|
| **Missed Poll Catch-up** | If the bot was offline and missed the 6 AM slot, it automatically detects this on startup and posts the daily poll to catch up. |
| **Fallback Polls** | If Gemini fails, the bot tries OpenRouter/free next, then falls back to a preset poll so your community always gets a question. |
| **Overload Protection** | When the AI is busy, the bot queues conversation requests and replies when it can — or asks users to try again in a minute. |
- **Spam Protection:** A cooldown prevents users from flooding the bot with conversation requests.
- **Automated Community Engagement:** Periodic friendly reminders to #general (every 14 days) and #team (every 9 days) to encourage feature discovery based on command usage stats.
- **Proactive AI Conversation:** The bot can intelligently "jump in" to conversations about AI or OWGT topics, even without being mentioned, making it feel like a real part of the community.
- **Optimized Startup:** Background processes ensure the bot is online instantly, syncing roles and invites without blocking connectivity.


---

## 📜 User Commands (Available to Everyone)

| Command | Description | Output |
|---------|-------------|--------|
| `/leaderboard` | Displays the current leaderboard standings. | An embed showing the top 10 users with the most points. |
| `/rank [@user]` | Checks the rank of a user on the server's leaderboard. | **`/rank`** — Shows your own rank and score.<br>**`/rank @SomeUser`** — Shows the mentioned user's rank and score. |
| `/help` | Displays a helpful embed listing all available commands. | Shows User Commands and Administrator Commands (if you have permissions). |

---

## 🔧 Administrator Commands

**Permissions:** These commands can only be used by **ar_him** or users with the **administrative role** (default is **@bot-control**, but this can be changed with `/setcontrolrole`).

| Command | Description |
|---------|-------------|
| `/settings` | Displays an overview of the current bot configuration, including permissions, welcome template, role milestones, and active states. |
| `/setcontrolrole <@role>` | Sets a new administrative role for the server. Members with this role will be able to run all admin commands. |
| `/milestones <add\|remove> [params]` | Manage role milestones.<br>• **add** `<points> <@role>` — Adds a milestone.<br>• **remove** `<points>` — Removes a milestone. |
| `/setcc <@user>` | Sets the user to be CC'd in the server's welcome messages. Defaults to the bot creator. |
| `/setwelcome <template>` | Sets a custom welcome message. Use placeholders: `{user}`, `{inviter}`, `{cc}`, and `{points_msg}`. |
| `/asknow [optional topic]` | Instantly generates a new, on-demand trivia poll. On-demand polls **do not affect** the leaderboard. Only one can be active on a server at a time.<br>• **`/asknow`** — Generates a poll on a random, general AI topic.<br>• **`/asknow Large Language Models`** — Generates a poll about the provided topic. |
| `/reveal` | Ends the active on-demand poll and reveals its answer. Posts an embed with the correct answer and a detailed explanation. |
| `/postdaily` | Manually triggers the daily poll sequence (posts the previous answer, then the new daily poll) in the channel. Useful for testing or correcting a schedule issue. |
| `/points <add\|remove\|set> <@user> <amount>` | Manually adjusts a user's score. Perfect for giveaways, correcting scores, or rewarding positive behavior.<br>• **add** — Adds points.<br>• **remove** — Subtracts points (cannot go below 0).<br>• **set** — Sets score to an exact value. |
| `/relinkpoll <message_id> <correct_option_#>` | Recovery tool: Fixes the bot's memory to track a specific poll for the next daily reveal. Use if a daily poll was manually deleted or an error caused a duplicate.<br>**Example:** `/relinkpoll 135123456789012345 3` — Option C is correct. |
| `/resolve` | Forces the bot to **immediately** resolve the poll in its memory. Awards points and posts the answer embed, but does **not** post a new daily poll.<br>**Usage:** Use `/relinkpoll` first to point to the missed poll, then run `/resolve` to sync the leaderboard and schedule. |
| `/update-knowledge <topic>` | Opens a form to add or update information for a specific topic (e.g., mission, team, ai-basics). Each topic can hold up to 4,000 characters. |
| `/knowledge-list` | Lists all topics currently in the bot's knowledge base. |
| `/knowledge-delete <topic>` | Deletes a specific topic from the knowledge base. |

---

## 📚 Managing the Bot's Knowledge

You can teach the bot about your community, non-profit, or AI topics directly from Discord using **Topics**. This avoids character limits and keeps information organized.

1. Use the **`/update-knowledge <topic>`** command.
2. A pop-up form appears for that specific topic.
3. Edit the text and click **Submit**.
4. Use **`/knowledge-list`** to see all your topics.
5. The bot automatically combines all topics to answer user questions!

---

<div align="center">

**Built with ❤️ for OWGT (OneWorldGreaterTogether)**

</div>
