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
## Troubleshooting: SSH Connects Then Disconnects Instantly

- **Symptom**: `ssh arham@hackclub.app` authenticates successfully, then hangs up
  before running any command. Output ends with:
  ```
  Received disconnect from 65.108.74.29 port 22:11:
  Disconnected from 65.108.74.29 port 22
  ```
  The same happens with `-tt`, without a TTY, over IPv4 and IPv6, for `exec`
  commands and for the `sftp` subsystem. Every attempt fails after 6 to 9 seconds.
- **Root Cause**: `hackclub.app` is a gateway, not the container itself. The banner
  reads `SSH-2.0-ssh2js1.17.0`, which identifies the Nest SSH proxy. The proxy accepted
  the login and then failed to open a session into the container, then dropped the
  channel. The container itself stayed up the whole time.
- **Ruled Out**:
  - SSH key, because authentication succeeded on every attempt.
  - Disk space, because the container had 680 MB used out of 16 GB (5%).
  - Local machine, because every SSH option and both IP versions failed identically.
  - The command itself, because a bare `true` failed the same way.
- **Fix**: Restart the container from the Nest dashboard (`Restart Container`).
  That cleared the stale gateway state and SSH worked on the next attempt. Safe to
  do at any time: code comes from GitHub, the database is remote (Neon), and the
  service is set to `Restart=always`, so the bot comes back within seconds.
- **Confirmation After Fix**: `hostname` returned `arham`, `uptime` showed a fresh
  boot, and `df -h /` showed 5% used. The service was already `active`.
- **Note**: The bot keeps running while SSH is broken. A dead SSH door does not mean
  a dead bot. Check the Nest dashboard memory usage or the bot's presence in Discord
  before assuming an outage.

---
## Archive / Legacy: HeavenCloud Notes & Past Fixes
Previously hosted on HeavenCloud before migrating to Hack Club Nest (Ubuntu 25.04).

- **Past Fixes Preserved in Codebase**:
  - **Database Connection**: Uses Neon HTTP fetch (`neonConfig.poolQueryViaFetch = true`) over port 443 to bypass restrictive egress firewalls.
  - **Environment Variables**: Native `process.loadEnvFile()` used across entry points (`index.js`, `config/index.js`).
  - **Code Hygiene**: Cleaned command syntax, resolved circular dependency in help command (`commands/user/help.js`), updated Discord.js ready event to `Events.ClientReady`.
- **Legacy Zip Notice**: If archiving code manually for Linux, always normalize file paths to forward slashes (`/`) so folders extract correctly.
