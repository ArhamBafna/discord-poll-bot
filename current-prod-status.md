# Current Live Production Status

## Current Live Production Status
- **Host**: Hack Club Nest Container (Ubuntu 25.04 x86_64, VMID 1906).
- **SSH Host**: `arham@hackclub.app`
- **Environment**: Node.js 22 LTS (`v22.23.3`) via NodeSource.
- **Directory**: `/root/discord-poll-bot`
- **Process Manager**: systemd (`discord-poll-bot.service`)
  - Auto-starts on server boot
  - Auto-restarts on crash (`Restart=always`, `RestartSec=10`)
  - Status: Active / Running 24/7

---

## Server Management Quick Reference
Connect via SSH:
```bash
ssh arham@hackclub.app
```

- **View Live Logs**:
  ```bash
  ./logs.sh
  # or: journalctl -u discord-poll-bot.service -f
  ```
- **Update Bot to Latest GitHub Code**:
  ```bash
  ./update.sh
  ```
- **Service Controls**:
  ```bash
  systemctl status discord-poll-bot
  systemctl restart discord-poll-bot
  systemctl stop discord-poll-bot
  ```

---
## Archive / Legacy: HeavenCloud Notes & Past Fixes
Previously hosted on HeavenCloud before migrating to Hack Club Nest (Ubuntu 25.04).

- **Past Fixes Preserved in Codebase**:
  - **Database Connection**: Uses Neon HTTP fetch (`neonConfig.poolQueryViaFetch = true`) over port 443 to bypass restrictive egress firewalls.
  - **Environment Variables**: Native `process.loadEnvFile()` used across entry points (`index.js`, `config/index.js`).
  - **Code Hygiene**: Cleaned command syntax, resolved circular dependency in help command (`commands/user/help.js`), updated Discord.js ready event to `Events.ClientReady`.
- **Legacy Zip Notice**: If archiving code manually for Linux, always normalize file paths to forward slashes (`/`) so folders extract correctly.
