# OWGT Bot

OWGT Bot posts a daily AI trivia poll in Discord and keeps score.

## Overview

OWGT Bot posts one trivia poll each day at 6:00 AM Eastern Time in the channels set by the owner. All daily polls are trivia with one correct answer.

Before each new daily poll, the bot posts the answer to the last poll, with an explanation and the count of members who voted correctly. Correct votes earn 1 point each.

The bot replies when mentioned or when you reply to its messages. It uses recent chat in that channel plus saved topics for context. It sometimes joins AI talk without a mention.

Every Sunday at 9:00 PM Eastern Time, the bot posts a weekly summary with the current top 10 by all-time points, plus a short AI comment comparing to last week.

If the bot starts up after 6 AM and no poll was posted today, it posts one catch-up poll for today. It does not backfill older days. If the AI services fail, it posts a preset trivia poll. Preset polls still award points.

## Leaderboard 🏆

Only daily polls award points. On-demand polls are for fun and give nothing.

To earn a point, vote for the correct answer within the 24 hour voting window. After the poll ends the bot adds 1 point per correct voter.

Admins can link point totals to Discord roles. The bot keeps only the highest reached milestone role per member, removes lower milestone roles, and posts a note in the same channel where the points were earned.

## Invite rewards 👋

When a member joins through an invite link, the bot posts a welcome in the server system channel if one exists. It names the inviter when it can find one, and adds points to the same leaderboard.

- Default is 1 point per invite.
- Change it with `/invitepoints`, including `0` to turn rewards off.
- If no inviter is found, no points are given.

Set a custom welcome template with `/setwelcome` and set a user to mention with `/setcc`. If no CC user is set, the welcome posts without one.

## Reliability

- On startup after 6 AM New York time, the bot posts today's poll if missing.
- If the main AI fails, the bot tries the backup provider, then posts a preset trivia poll.
- Mention replies have a 4 second cooldown per user. When overloaded, replies may arrive late.

## User commands

Anyone can run these.

| Command | What it does |
|---------|--------------|
| `/leaderboard` | Top 10 members by all-time points on this server. |
| `/rank [@user]` | Rank and score for yourself, or for the named user. |
| `/help` | Lists all commands. |

## Administrator commands

These all need the admin control role. The default role is `bot-control`. Create a role with that name and give it to trusted admins. Change it with `/setcontrolrole`.

| Command | What it does |
|---------|--------------|
| `/settings` | Shows current bot settings. |
| `/points add @user <amount>` | Adds points to a user. |
| `/points remove @user <amount>` | Removes points. Score never goes below 0. |
| `/points set @user <amount>` | Sets score to an exact value, 0 or more. |
| `/knowledge update <topic>` | Opens a form to add or change text for that topic. Each topic holds up to 4000 characters. |
| `/knowledge list` | Lists all saved topics. |
| `/knowledge delete <topic>` | Deletes one topic. |
| `/milestones add <points> <@role>` | Gives the role at that point total. Keeps highest reached only. |
| `/milestones remove <points>` | Removes the milestone for that point total. |
| `/invitepoints <points>` | Points per invite. `0` turns rewards off. Range 0 to 100. |
| `/asknow [topic]` | On-demand trivia poll for fun. Gives no points. Only one can be active per server, end it with `/resolve poll:on-demand` before starting another. With no topic, uses a general AI topic. |
| `/postdaily` | Runs the daily sequence now, posts last answer then a new poll. Can duplicate if today's poll already ran. |
| `/relinkpoll <message_id> <correct_option>` | Points the bot at a specific poll message for the next reveal. Options start at 1, range 1 to 10. Example: `/relinkpoll 135123456789012345 3` means option 3, letter C, is correct. |
| `/resolve <poll>` | Ends a poll now and posts the answer. Use `poll:on-demand` or `poll:daily`. Daily awards points, on-demand does not. Daily resolve also clears it from memory. |
| `/setcc <@user>` | Sets the user mentioned as CC in welcome messages. |
| `/setwelcome <template>` | Sets the welcome text. Placeholders are `{user}`, `{inviter}`, `{cc}`, `{points_msg}`. |
| `/setcontrolrole <@role>` | Sets which role can run admin commands. |

Welcome template example:

```
Welcome {user}, invited by {inviter} (cc {cc}) {points_msg}
```

`{user}` is the new member, `{inviter}` is the inviter or someone unknown, `{cc}` is the CC user or the team, `{points_msg}` is the invite points text or empty.

## Knowledge topics

`/knowledge` is the base command. Add one word after it to pick what to do.

1. Run `/knowledge update <topic>` with the topic name.
2. A form opens for that topic. Edit the text and submit.
3. Run `/knowledge list` to see all topics.
4. The bot uses all saved topics when answering.

Made for [OWGT (OneWorldGreaterTogether)](https://linktr.ee/owgt).
