---
name: deploy-bot
description: Update Discord poll bot to latest GitHub code and deploy live on production server. Use when user says "deploy bot", "update bot", "deploy to prod", "deploy live", "sync prod", "push to prod", or "/deploy-bot".
---

# Deploy Bot

Deploy latest code to live production Discord bot.

## Host Details

- Host: `arham@hackclub.app` (Hack Club Nest container, Ubuntu 25.04)
- Path: `/root/discord-poll-bot`
- Service: `discord-poll-bot.service`
- Script: `/root/update.sh`
- Logs: `/root/logs.sh` or `journalctl -u discord-poll-bot.service -f`

## Pre-flight Check

Remote server pull directly from GitHub `main`. Local changes must reach GitHub first.

1. Check local git status:
   ```powershell
   git status
   ```
2. If uncommitted changes: commit now.
3. If unpushed commits (`ahead of origin/main`):
   ```powershell
   git push origin main
   ```
4. Verify local clean and synced with `origin/main`.

## Deployment Steps

1. Connect SSH, run update script:
   ```powershell
   ssh arham@hackclub.app "./update.sh"
   ```
   Script run:
   - `git pull` inside `/root/discord-poll-bot`
   - `npm install --omit=dev`
   - `systemctl restart discord-poll-bot.service`
   - `systemctl status discord-poll-bot.service --no-pager`

2. Verify startup logs:
   ```powershell
   ssh arham@hackclub.app "journalctl -u discord-poll-bot.service -n 25 --no-pager"
   ```

3. Confirm success markers:
   - `[DISCORD] Login successful!`
   - `[STARTUP] Logged in as OWGT Bot#7061!`
   - `[STARTUP] Commands refreshed and background tasks started`
   - `[STARTUP] Bot is fully operational.`

## Anti-Patterns (NEVER Do)

- NEVER run remote update before pushing local code to GitHub `origin/main`. Remote pulls from GitHub, misses unpushed work.
- NEVER edit code directly inside `/root/discord-poll-bot` on server. Causes git pull conflicts.
- NEVER report deploy success without checking `journalctl` logs for startup crash or database connection failure.
- NEVER dump `.env` contents or token values in output.

## Troubleshooting

- **Git merge conflict on server**:
  Run SSH check:
  ```powershell
  ssh arham@hackclub.app "cd /root/discord-poll-bot && git status"
  ```
  If dirty, reset remote to clean main:
  ```powershell
  ssh arham@hackclub.app "cd /root/discord-poll-bot && git reset --hard origin/main"
  ```

- **Service failed to start**:
  Inspect full error log:
  ```powershell
  ssh arham@hackclub.app "journalctl -u discord-poll-bot.service -n 50 --no-pager"
  ```
  Common issues: syntax error, missing environment variable, or database connection timeout.

- **Manual service restart**:
  ```powershell
  ssh arham@hackclub.app "systemctl restart discord-poll-bot.service"
  ```

## Report Format

Report terse summary to user:
- Commit deployed (hash + title)
- Service status (active / running)
- Bot login confirmation (`OWGT Bot#7061`)
