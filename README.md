# OWGT Bot

OWGT Bot posts a daily AI poll in Discord and keeps score.

## Overview

OWGT Bot posts one poll each day at 6:00 AM Eastern Time in the channels set by the owner. Polls cover AI topics. Some days the poll is trivia with one correct answer. Other days it is a discussion poll with no correct answer.

Before each new daily poll, the bot posts the answer to the last trivia poll, with an explanation and the list of members who voted correctly. Correct votes on daily trivia polls earn 1 point each on the leaderboard.

The bot also replies when mentioned or when replying to its messages, using past conversation and saved topics for context.

Every Sunday at 9:00 PM Eastern Time, the bot posts a weekly summary with the top 10 members for each server.

If the bot was offline at 6 AM, it posts the missed daily poll on startup. If the AI services fail, it uses a preset poll so the daily post still appears.

## Leaderboard

Only daily trivia polls award points. Discussion polls and on-demand polls do not award points.

To earn a point, vote for the correct answer on the daily trivia poll. After 24 hours the bot counts correct votes and adds 1 point per correct voter. No emoji reaction is needed.

Role milestones: admins can link point totals to Discord roles. When a member reaches a milestone, the bot assigns the new role, removes the old milestone role, and posts a note in the channel.

## Invite rewards

When a member joins through an invite link, the bot posts a welcome message in the system channel, names the inviter when it can find one, and gives the inviter points. The default is 1 point per invite. Admins can change this with /invitepoints, including 0 to turn rewards off.

Admins can set a custom welcome template with /setwelcome and set a user to CC with /setcc.

## Reliability

Missed poll catch-up: on startup the bot checks for a missed 6 AM poll and posts it.

Fallback polls: if the main AI fails, the bot tries the backup provider, then a preset poll.

Spam protection: conversation requests have a cooldown to stop flooding.

Startup: role sync and invite caching run in the background so login is not blocked.

## User commands

| Command | Description |
|---------|-------------|
| /leaderboard | Shows the top 10 members by points on this server. |
| /rank [@user] | Shows rank and score for yourself, or for the named user. |
| /help | Lists all commands. Shows admin commands too, marked as admin. |

## Administrator commands

Only ar_him or members with the control role can run these. The default control role is bot-control. Change it with /setcontrolrole.

| Command | Description |
|---------|-------------|
| /settings | Shows current bot settings. |
| /points add @user <amount> | Adds points to a user. |
| /points remove @user <amount> | Removes points. Score never goes below 0. |
| /points set @user <amount> | Sets score to an exact value. |
| /knowledge update <topic> | Opens a form to add or change text for one topic. Each topic holds up to 4000 characters. |
| /knowledge list | Lists all saved topics. |
| /knowledge delete <topic> | Deletes one topic. |
| /milestones add <points> <@role> | Gives the role to members who reach the point total. |
| /milestones remove <points> | Removes the milestone for that point total. |
| /invitepoints <points> | Sets points per successful invite. 0 turns rewards off. Range 0 to 100. |
| /asknow [topic] | Posts an on-demand trivia poll now. Does not award points. Only one can be active per server. With no topic, uses a general AI topic. |
| /postdaily | Runs the daily poll sequence now (posts last answer, then a new daily poll). |
| /relinkpoll <message_id> <correct_option> | Points the bot at a specific poll message to track for the next reveal. Example: /relinkpoll 135123456789012345 3 means option C is correct. |
| /resolve <poll> | Ends a poll now and posts the answer. Use on-demand or daily. Awards points for daily trivia. |
| /setcc <@user> | Sets the user named in welcome messages. |
| /setwelcome <template> | Sets the welcome message text. Placeholders: {user}, {inviter}, {cc}, {points_msg}. |
| /setcontrolrole <@role> | Sets which role can run admin commands. |

## Knowledge topics

1. Run /knowledge update and enter the topic name.
2. A form opens for that topic. Edit the text and submit.
3. Run /knowledge list to see all topics.
4. The bot uses all saved topics when answering questions.

Built for OWGT (OneWorldGreaterTogether).
