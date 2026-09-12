# OWGT Bot

OWGT Bot posts a daily AI trivia poll in Discord and keeps score.

## Overview

OWGT Bot posts one trivia poll each day at 6:00 AM Eastern Time in the channels set by the owner. All daily polls are trivia with one correct answer.

Before each new daily poll, the bot posts the answer to the last trivia poll, with an explanation and the count of members who voted correctly. Correct votes on daily polls earn 1 point each on the leaderboard.

The bot replies when mentioned or when replying to its messages. It uses recent chat in that channel plus saved topics for context. It may also join in on AI talk without a mention.

Every Sunday at 9:00 PM Eastern Time, the bot posts a weekly summary with the current top 10 members by all-time points, plus a short AI comment comparing to last week.

If the bot starts up after 6 AM and no poll was posted today, it posts one catch-up poll for today. It does not backfill older days. If the AI services fail, it posts a preset trivia poll. Preset polls still award points.

## Leaderboard

Only daily polls award points. On-demand polls do not award points.

To earn a point, vote for the correct answer on the daily poll within its 24 hour voting window. After the poll ends the bot adds 1 point per correct voter.

Role milestones: admins can link point totals to Discord roles. The bot keeps only the highest reached milestone role per member, removes lower milestone roles, and posts a note in the same channel where points were earned.

## Invite rewards

When a member joins through an invite link, the bot posts a welcome message in the server system channel if one exists. It names the inviter when it can find one, and adds points to the same leaderboard. The default is 1 point per invite. Admins can change this with /invitepoints, including 0 to turn rewards off. If no inviter is found, no points are given.

Admins can set a custom welcome template with /setwelcome and set a user to mention with /setcc. If no CC user is set, the welcome posts without a specific CC default.

## Reliability

Missed poll catch-up: on startup after 6 AM New York time, the bot posts today's poll if missing.

Fallback polls: if the main AI fails, the bot tries the backup provider, then posts a preset trivia poll.

Spam protection: mention replies have a 4 second cooldown per user. Overload may delay replies briefly.

## User commands

| Command | Description |
|---------|-------------|
| /leaderboard | Shows the top 10 members by all-time points on this server. |
| /rank [@user] | Shows rank and score for yourself, or for the named user. |
| /help | Lists all commands. Shows admin commands too, marked as admin. |

## Administrator commands

Only members with the admin control role can run these. The default control role is bot-control. Change it with /setcontrolrole. Create a role with that name and assign it to trusted admins.

| Command | Access | Description |
|---------|--------|-------------|
| /settings | admin | Shows current bot settings. |
| /points add @user <amount> | admin | Adds points to a user. |
| /points remove @user <amount> | admin | Removes points. Score never goes below 0. |
| /points set @user <amount> | admin | Sets score to an exact value. 0 or more. |
| /knowledge update <topic> | admin | Opens a form to add or change text for that topic. Each topic holds up to 4000 characters. |
| /knowledge list | admin | Lists all saved topics. |
| /knowledge delete <topic> | admin | Deletes one topic. |
| /milestones add <points> <@role> | admin | Gives the role to members who reach the point total. Keeps highest reached only. |
| /milestones remove <points> | admin | Removes the milestone for that point total. |
| /invitepoints <points> | admin | Sets points per successful invite. 0 turns rewards off. Range 0 to 100. |
| /asknow [topic] | admin | Posts an on-demand trivia poll now for fun. Does not award points. Only one can be active per server. Finish it with /resolve poll:on-demand before starting another. With no topic, uses a general AI topic. |
| /postdaily | admin | Runs the daily poll sequence now (posts last answer, then a new daily poll). Can create a duplicate if today's poll already ran. |
| /relinkpoll <message_id> <correct_option> | admin | Points the bot at a specific poll message to track for the next reveal. Options start at 1. Range 1 to 10. Example: /relinkpoll 135123456789012345 3 means option 3, letter C, is correct. |
| /resolve <poll> | admin | Ends a poll now and posts the answer. Use poll:on-demand for on-demand, poll:daily for last daily. Daily awards points, on-demand does not. Daily resolve also clears it from memory. |
| /setcc <@user> | admin | Sets the user mentioned as CC in welcome messages. |
| /setwelcome <template> | admin | Sets the welcome message text. Placeholders: {user} new member, {inviter} inviter or someone unknown, {cc} CC user or the team, {points_msg} invite points text or empty. Example: Welcome {user}, invited by {inviter} (cc {cc}) {points_msg} |
| /setcontrolrole <@role> | admin | Sets which role can run admin commands. |

## Knowledge topics

1. Run /knowledge update <topic> with the topic name.
2. A form opens for that topic. Edit the text and submit.
3. Run /knowledge list to see all topics.
4. The bot uses all saved topics when answering questions.

Made for OWGT (OneWorldGreaterTogether). More info: https://linktr.ee/owgt
