# Database runbook

Do these steps in order every time the database changes. Plain words only.

## 1. Back up the live database

Run:

```
node tools/db/backup.js backups/live-YYYY-MM-DD.json
```

This saves all tables (schema plus rows) to one file. Keep the file somewhere safe.

## 2. Make a copy database

Create an empty Postgres database for testing. Set its URL aside as the copy URL. Never use the live URL for testing.

## 3. Copy live data into the test copy

Point restore at the copy and load the backup:

```
set COPY_URL=<your copy database url>
node tools/db/restore.js backups/live-YYYY-MM-DD.json
```

Note: restore needs the COPY_URL set as DATABASE_URL when you run it. Tables must exist first. Start the bot once against the copy so it creates the tables, then run restore.

## 4. Test the change on the copy first

Run the migration files against the copy only:

```
node tools/db/migrate-test.js <copy-url> tools/db/migrations
```

You get PASS or FAIL per file. If any file says FAIL, stop. Fix the file, then run again. Never touch live data while a test fails.

## 5. Check the copy still holds the same data

Take a backup of the copy after the test and compare with the backup from step 1:

```
node tools/db/backup.js backups/copy-after.json
node tools/db/validate.js backups/live-YYYY-MM-DD.json backups/copy-after.json
```

For a migration that only changes shape (not data), every table should say MATCH and the end should say PASS. For a migration that moves data on purpose, only the tables it was meant to change should say DIFF.

## 6. Apply to live

Only when the copy test says PASS, run the same migration files against live. Then take a new live backup and keep it.

## Proof the backup works

To prove a snapshot restores the same state: restore a backup into an empty copy, back up the copy again, then validate the two files. Both should say PASS.
