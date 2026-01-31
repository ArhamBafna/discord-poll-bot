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

Key features include a **fully automated leaderboard system**, a **weekly AI-generated performance summary**, and a **suite of on-demand commands** for administrators.

---

## ✨ Core Features

### 📅 Daily Scheduled Polls

| When | Every day at **6:00 AM Eastern Time (ET)** |
|------|-------------------------------------------|
| **What** | The bot posts a new poll in its designated channel(s). |

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

| How to Trigger | • Mention the bot directly (e.g., `@OWGT Bot how are you?`)<br>• Reply to any of the bot's messages (including polls and answers) |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| **What it Does** | Remembers the last few messages in your conversation to maintain context. The bot can answer questions about the server leaderboard and any custom topics you teach it using the `/update-knowledge` command. |

### 📊 Weekly Leaderboard Summary

| When | Every **Sunday at 9:00 PM Eastern Time (ET)** |
|------|----------------------------------------------|
| **What** | The bot posts a special **"Weekly Poll Report"** embed featuring a unique, human-like summary of the week's leaderboard activity (written by Gemini AI) and the **Top 10** highest-scoring members for that server. |

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

*Score: Each correctly answered daily trivia poll is worth **1 point**. The bot maintains a persistent score for you on each server.*

---

## 🎁 Bonus: Invite Rewards

When someone joins your server via an **invite link**:

- The bot **welcomes them** in the system channel.
- It identifies **who invited them** (when possible).
- **Automatically awards 1 point** to the inviter for each successful invite! 🎉
- If the inviter can't be determined, the bot still welcomes the new member warmly.

---

## ⚡ Reliability Features

| Feature | Description |
|---------|-------------|
| **Missed Poll Catch-up** | If the bot was offline and missed the 6 AM slot, it automatically detects this on startup and posts the daily poll to catch up. |
| **Fallback Polls** | If the Gemini AI API fails, the bot deploys a fallback poll so your community always gets a question. |
| **Overload Protection** | When the AI is busy, the bot queues conversation requests and replies when it can — or asks users to try again in a minute. |
| **Spam Protection** | A cooldown prevents users from flooding the bot with conversation requests. |

---

## 📜 User Commands (Available to Everyone)

| Command | Description | Output |
|---------|-------------|--------|
| `/leaderboard` | Displays the current leaderboard standings. | An embed showing the top 10 users with the most points. |
| `/rank [@user]` | Checks the rank of a user on the server's leaderboard. | **`/rank`** — Shows your own rank and score.<br>**`/rank @SomeUser`** — Shows the mentioned user's rank and score. |
| `/help` | Displays a helpful embed listing all available commands. | Shows User Commands and Administrator Commands (if you have permissions). |

---

## 🔧 Administrator Commands

**Permissions:** These commands can only be used by **ar_him** or users with the **@bot-control** role.

| Command | Description |
|---------|-------------|
| `/asknow [optional topic]` | Instantly generates a new, on-demand trivia poll. On-demand polls **do not affect** the leaderboard. Only one can be active on a server at a time.<br>• **`/asknow`** — Generates a poll on a random, general AI topic.<br>• **`/asknow Large Language Models`** — Generates a poll about the provided topic. |
| `/reveal` | Ends the active on-demand poll and reveals its answer. Posts an embed with the correct answer and a detailed explanation. |
| `/postdaily` | Manually triggers the daily poll sequence (posts the previous answer, then the new daily poll) in the channel. Useful for testing or correcting a schedule issue. |
| `/points <add\|remove\|set> <@user> <amount>` | Manually adjusts a user's score. Perfect for giveaways, correcting scores, or rewarding positive behavior.<br>• **add** — Adds points.<br>• **remove** — Subtracts points (cannot go below 0).<br>• **set** — Sets score to an exact value. |
| `/update-knowledge` | Opens a form to teach the bot about your community, non-profit, or any topic. The bot uses this information in conversations. |
| `/relinkpoll <message_id> <correct_option_#>` | Recovery tool: Fixes the bot's memory to track a specific poll for the next daily reveal. Use if a daily poll was manually deleted or an error caused a duplicate.<br>**Example:** `/relinkpoll 135123456789012345 3` — Option C is correct. |
| `/resolve` | Forces the bot to **immediately** resolve the poll in its memory. Awards points and posts the answer embed, but does **not** post a new daily poll.<br>**Usage:** Use `/relinkpoll` first to point to the missed poll, then run `/resolve` to sync the leaderboard and schedule. |

---

## 📚 Managing the Bot's Knowledge

You can teach the bot about your community, non-profit, or any topic directly from Discord.

1. Use the **`/update-knowledge`** command in any channel.
2. A pop-up form appears, pre-filled with the bot's current knowledge.
3. Edit the text (bullet points, newlines, normal English).
4. Click **Submit**. The bot confirms and immediately starts using the new information in conversations.

---

<div align="center">

**Built with ❤️ for OWGT (OneWorldGreaterTogether)**

</div>
