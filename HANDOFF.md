# Handoff: HeavenCloud Deployment & Bot Setup

## Current Status
- Server created on HeavenCloud: `heavencloud.in | discord-poll-bot` (Miami node, Pterodactyl-based panel).
- Server specs: 512 MB RAM, 715 MB disk, 0.5 vCPU, Node.js 25 environment (`ghcr.io/ptero-eggs/yolks:nodejs_25`).
- Server status: Offline, files staged, awaiting upload of latest zip and launch via Console.
- Codebase status: All syntax errors resolved, automatic `.env` loading added, full syntax check passing across all files.

---

## Errors Encountered & What Changed

### 1. Windows Zip Backslash Pathology (`MODULE_NOT_FOUND`)
- **Problem**: When `Compress-Archive` was run in Windows PowerShell, zip headers contained Windows backslashes (`\`, e.g., `bot\client.js`). On Linux/Pterodactyl, `\` is treated as a literal character in the filename rather than a directory delimiter. The archive unpacked as flat files in root rather than nested directories.
- **Fix**: Generated zip using Python's `zipfile` module which normalizes all path separators to forward slashes (`/`), ensuring Linux extracts proper directory trees (`bot/`, `commands/`, `database/`, etc.).

### 2. Missing Environment Variables (`DATABASE_URL is not a valid URL`)
- **Problem**: The egg startup script runs `ts-node --esm index.js ${NODE_ARGS}`. Node does not load `.env` files into `process.env` by default. Passing `--env-file=.env` in `NODE_ARGS` placed the flag *after* the script path, causing Node/ts-node to treat it as a script argument rather than a Node CLI flag.
- **Fix**: Added native Node.js stdlib `try { process.loadEnvFile(); } catch (e) {}` at the top of `index.js` and `config/index.js`. Loads `.env` automatically on Node 20+ without external packages or CLI flags.

### 3. Syntax Errors in Commands & Handlers
- **Problem**: Accidental double-escaped quotes and escaped backticks caused syntax failures:
  - `commands/registry.js:91`: `\\'d` inside single-quoted string caused `SyntaxError: missing ) after argument list`.
  - `commands/admin/setwelcome.js:13`: `someone\\'s` inside single-quoted string caused syntax error.
  - `commands/user/help.js:11`: Escaped backticks `\`/\${cmd.builder.name}\`` caused `SyntaxError: Invalid or unexpected token`.
  - `handlers/interaction.js:57, 92, 93, 97, 107`: Escaped backticks in template literals.
- **Fix**: Fixed all quotes and template strings. Verified clean syntax across all `.js` files via `node -c`.

---

## How to Create the HeavenCloud Compatible Zip

> **Warning**: Never use Windows `Compress-Archive` directly for Linux servers, as it embeds `\` backslashes.

Run this command in project root:
```powershell
python -c "import zipfile, os; dirs=['assets','bot','commands','config','database','handlers','lib','services','state','tools','utils']; files=['index.js','package.json','package-lock.json','.env']; z=zipfile.ZipFile('bot.zip','w',zipfile.ZIP_DEFLATED); [z.write(f,f) for f in files if os.path.exists(f)]; [z.write(os.path.join(r,fn), os.path.join(r,fn).replace('\\\\','/')) for d in dirs for r,_,fs in os.walk(d) for fn in fs]; z.close()"
```

### Inclusions & Exclusions
- **Must Include**:
  - Code folders: `assets/`, `bot/`, `commands/`, `config/`, `database/`, `handlers/`, `lib/`, `services/`, `state/`, `tools/`, `utils/`
  - Core files: `index.js`, `package.json`, `package-lock.json`, `.env`
- **Must Exclude**:
  - `node_modules/` (server runs `npm install` automatically)
  - `.git/` (heavy history unnecessary on server)
  - `test/`, `graphify-out/` (dev-only tools)

---

## Next Steps to Run Bot
1. Open HeavenCloud -> **Files** (`/home/container/`).
2. Upload the newly generated `bot.zip`.
3. Click `...` -> **Unarchive** (overwrite existing files).
4. Delete `bot.zip` to save disk space.
5. Go to **Console** -> Click **Start**.
6. Monitor startup logs to confirm Discord bot logs in and database connects.

---

## Suggested Skills
- `debugging-and-error-recovery`: If runtime Discord gateway or database connection errors occur.
- `pick-browser-auto`: If web-based panel automation is requested in future sessions.
