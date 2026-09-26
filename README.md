# Discord AI Poll Bot

A fun and futuristic Discord bot that:
- posts daily AI trivia
- tracks leaderboards
- chats with your server
(a lot of other exquisite features listed later)
  
![Bot Example](assets/discord-bot-eg.png)

## Quick start / Local setup

You can self-host the bot for now. Direct invites are coming very soon.

You need:
- Node.js 22+
- PostgreSQL  
- Discord bot token (from Discord Developer Portal)
- Google Gemini API key
- OpenRouter API (optional)

How to set up:
- Use git to clone this repo. 
- Install dependencies with 'npm install'
- Copy the .env.example as .env and fill it out with your bot token, Gemini API key, database URL, target channel IDs, and optionally OpenRouter API key.
- Actually run it with 'npm start'

## Features

- Daily AI trivia polls (at a customizable time)
- Awards points for correct poll answers
- Optionally, awards points for invites
- Maintains a leaderboard of points
- Responds to @ mentions and sometimes joins conversations (as a simple AI chatbot)
- Weekly summaries every Sunday at 9 PM Eastern (time to soon be customizable)
- Preset backup polls when APIs fail to generate one
- Has a knowledge base it uses when chatting
- A lot of other features. Find them out on Discord!

## How it works

- Discord.js for Discord connection.
- Uses AI services: mainly the Gemini API, but the OpenRouter API for backup.
- AI generates polls + answer explanations + responses in chat.
- Daily polls have catch-up logic TOO!! If the bot is offline when it was supposed to post the poll, it posts it when it gets online! Pretty neat right
- Leaderboard is PostgreSQL.

## Commands

**Everyone can use:**
- '/leaderboard' - Top 10 point leaders
- '/rank [@user]' - Yours/ someone else's rank
- '/help' - All available commands

**Only admins can use:** (need 'bot-control' role)
- '/settings' - Current bot config
- '/points add/remove/set @user <amount>' - add/subtract/set a user's points
- '/asknow [topic]' - generate a trivia poll right now (optionally, on a specific topic). No points awarded
- '/milestones add <points> <@role>' - At certain points, give a milestone role (beta)
- '/invitepoints <amount>' - Points to give a member upon inviting someone
- '/knowledge update/list/delete <topic>' - Update the knowledge base
- '/setwelcome <template>' - Custom message to welcome a new user.

## Other

Feel free to make issues or PRs!

Built for [OWGT (OneWorldGreaterTogether)](https://linktr.ee/owgt), a non-profit dedicated to empowering students through technology.
