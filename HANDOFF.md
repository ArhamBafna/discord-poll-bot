# Handoff: HeavenCloud Deployment & Bot Setup

## Current Status
- Server: HeavenCloud Miami node (`discord-poll-bot`).
- Environment: Node.js 25 (`ghcr.io/ptero-eggs/yolks:nodejs_25`).
- Codebase status: Database driver switched to HTTP fetch. All warnings, circular deps, deprecations fixed. Local test pass. Pushed to GitHub.

---

## Direct GitHub Repo Setup (Preferred over Zip)
> **Reminder**: Connect HeavenCloud directly to GitHub repo. Do not manually upload zip files.
- HeavenCloud startup script already supports git auto-update:
  ```bash
  if [[ -d .git ]] && [[ ${AUTO_UPDATE} == "1" ]]; then git pull; fi;
  ```
- Setup:
  1. Clone repo or link GitHub repo in HeavenCloud server settings / startup tab.
  2. Set `AUTO_UPDATE=1` in server environment variables.
  3. Every `git push` updates server automatically on restart.
  4. Ensure `.env` exists in root on server (`process.loadEnvFile()` loads it).

---

## Errors Encountered & Fixes

### 1. Windows Zip Backslash Pathology (`MODULE_NOT_FOUND`)
- **Problem**: `Compress-Archive` in PowerShell put Windows `\` in zip paths. Linux unzipped flat files in root.
- **Fix**: Python `zipfile` script normalizes path to `/`. Linux extracts clean folder tree.

### 2. Missing Environment Variables (`DATABASE_URL is not a valid URL`)
- **Problem**: Panel startup command passed `--env-file` as script argument, not Node CLI flag.
- **Fix**: Added native Node.js `try { process.loadEnvFile(); } catch (e) {}` in `index.js` and `config/index.js`.

### 3. Syntax Errors in Commands & Handlers
- **Problem**: Double-escaped quotes and bad template literals broke parsing.
- **Fix**: Cleaned syntax across all command files. Verified clean with `node -c`.

### 4. Database Port 5432 & WebSocket Egress Blocked (`ETIMEDOUT`)
- **Problem**: HeavenCloud container firewall / DDoS proxy blocks outbound port 5432 (TCP) AND outbound WebSocket connections (`wss://`). Driver crashed with `WebSocket connection failed ... connect ETIMEDOUT`.
- **Fix**:
  1. In `database/connection.js`, set `neonConfig.poolQueryViaFetch = true`. Queries now travel over standard HTTPS POST (port 443).
  2. Neon fetch driver is stateless. It rejects `pool.connect()` and transaction blocks (`BEGIN`/`COMMIT`).
  3. Refactored `database/initialization.js` to use `pool.query()` directly.
  4. Refactored `services/invites/tracking.js` to use single atomic `pool.query()` upsert, removed redundant `BEGIN`/`COMMIT`.
  5. Verified against official HeavenCloud policy: outbound HTTPS port 443 fully allowed.

### 5. Circular Dependency in Help Command
- **Problem**: `commands/user/help.js` imported `handlers/commands/registry.js` at root level. Registry imported all commands, causing circular loop warning: `Accessing non-existent property 'getAllCommands' of module exports inside circular dependency`.
- **Fix**: Moved `require('../../handlers/commands/registry')` inside `execute()` function in `commands/user/help.js`.

### 6. Deprecated Discord.js Ready Event
- **Problem**: Discord.js v14 emits deprecation warning for `client.on('ready', ...)`.
- **Fix**: Updated `index.js` to import `Events` and use `client.once(Events.ClientReady, ...)`.

---

## Fallback: How to Create HeavenCloud Compatible Zip
If not using direct GitHub sync, run in project root:
```powershell
python -c "import zipfile, os; dirs=['assets','bot','commands','config','database','handlers','lib','services','state','tools','utils']; files=['index.js','package.json','package-lock.json','.env']; z=zipfile.ZipFile('bot.zip','w',zipfile.ZIP_DEFLATED); [z.write(f,f) for f in files if os.path.exists(f)]; [z.write(os.path.join(r,fn), os.path.join(r,fn).replace('\\\\','/')) for d in dirs for r,_,fs in os.walk(d) for fn in fs]; z.close()"
```

### Inclusions & Exclusions
- **Include**: `assets/`, `bot/`, `commands/`, `config/`, `database/`, `handlers/`, `lib/`, `services/`, `state/`, `tools/`, `utils/`, `index.js`, `package.json`, `package-lock.json`, `.env`
- **Exclude**: `node_modules/`, `.git/`, `test/`, `graphify-out/`

---

## Next Steps to Run Bot
1. **With GitHub Sync**: Restart server on HeavenCloud panel. Server pulls newest commit and starts.
2. **With Zip Upload**:
   - Upload `bot.zip` to HeavenCloud `/home/container/`.
   - Unarchive (overwrite existing).
   - Delete `bot.zip`.
   - Start console.
3. Check console logs: verify `[Database] Connected successfully (via HTTP fetch)` and Discord bot ready.
