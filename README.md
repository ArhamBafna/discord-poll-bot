# Discord AI Poll Bot

A futuristic Discord bot that posts daily AI trivia, tracks leaderboards, and chats with your server.

![Bot Example](assets/discord-bot-eg.png)

## Quick start

This bot is built for self-hosting. You'll need to set up your own instance.

**Install dependencies:**
```bash
npm install
```

**Configure:**
Copy the .env.example as .env and fill it out as shown later.

**Run:**
```bash
npm start
```

## Features

- Daily AI trivia polls at a customizable time
- Point tracking with server leaderboards  
- Responds to @ mentions and sometimes joins conversations
- Invite = points systems
- Weekly summaries every Sunday at 9 PM Eastern
- Backup polls when AI services fail

## Local setup

You need:
- Node.js 22+
- PostgreSQL  
- Discord bot token
- Google Gemini API key
- OpenRouter API (optional)

Add these to your .env file:

```bash
DISCORD_BOT_TOKEN=your_discord_bot_token_here
API_KEY=your_gemini_api_key_here  
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
TARGET_CHANNEL_IDS=channel_id_1,channel_id_2
OPENROUTER_API_KEY=your_openrouter_key_here
```
The OpenRouter API Key is an optional backup.

Start with:
```bash
npm start
```

## How it works

Discord.js handles the Discord connection. Google Gemini generates trivia questions and powers chat responses. When Gemini goes down, the bot tries OpenRouter, then falls back to preset questions.

The daily polls run are schedule-based but include catch-up logic. If you start the bot after 6 AM it posts today's poll if it's missing. The leaderboard is PostgreSQL.

## Commands

**Everyone:**
- '/leaderboard' - Top 10 point leaders
- '/rank [@user]' - Your rank or someone else's
- '/help' - All available commands

**Admins:** (need 'bot-control' role)
- '/settings' - Current bot settings
- '/points add/remove/set @user <amount>' - Manage user points
- '/asknow [topic]' - Instant trivia poll (no points awarded)
- '/milestones add <points> <@role>' - Role rewards at point thresholds
- '/invitepoints <amount>' - Points per successful invite
- '/knowledge update/list/delete <topic>' - Custom knowledge topics
- '/postdaily' - Manual daily poll trigger
- '/setwelcome <template>' - Custom welcome messages

## Other

Feel free to make issues or PRs!

Built for [OWGT (OneWorldGreaterTogether)](https://linktr.ee/owgt), a non-profit dedicated to empowering students through technology.
