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
- `/leaderboard` - Displays the top 10 point leaders on the server.
- `/rank [@user]` - Shows your rank or a mentioned user's rank (defaults to you).
- `/help` - Shows the help message with all available commands.

**Only admins can use:** (requires the configured control role, default `bot-control`, or bot creator)
- `/config view` - Displays the current server configuration overview and health stats.
- `/config welcome <template>` - Sets the welcome message template for new members. Supports `{user}`, `{inviter}`, `{cc}`, and `{points_msg}`.
- `/config cc <@user>` - Sets which user to CC in new member welcome messages.
- `/config role <@role>` - Sets which role has permission to run administrative commands.
- `/config invite-points <points>` - Sets how many points are awarded per successful server invite (0–100).
- `/poll ask [topic]` - Starts an on-demand trivia poll immediately (optionally with a custom topic; does not award points).
- `/poll resolve <poll>` - Manually resolves either an `on-demand` or `daily` poll.
- `/poll relink <message_id> <correct_option>` - Reconnects the bot's memory to track a poll that was missed or deleted (message ID and option number 1–10).
- `/points add <@user> <amount> [message]` - Adds points to a user with an optional reason note.
- `/points remove <@user> <amount>` - Removes points from a user.
- `/points set <@user> <amount>` - Sets a user's points to an exact score.
- `/milestones add <points> <@role>` - Automatically awards a role when a user reaches a point milestone.
- `/milestones remove <points>` - Removes a role milestone for a specific point threshold.
- `/knowledge update <topic>` - Adds or updates a topic in the bot's knowledge base via an interactive popup.
- `/knowledge list` - Lists all topics currently saved in the knowledge base.
- `/knowledge delete <topic>` - Deletes a topic from the knowledge base.

## Other

Feel free to make issues or PRs!

Built for [OWGT (OneWorldGreaterTogether)](https://linktr.ee/owgt), a non-profit dedicated to empowering students through technology.
