#!/bin/sh
# boot-restore.sh - restore the OmniRoute SQLite database from the encrypted
# state file (if configured), then start the app. Safe to run on every boot:
# if the download or decryption fails, the app starts with a fresh database
# (the watchdog restores configuration within minutes as a backstop).
set -u
if [ -n "${STATE_PASSPHRASE:-}" ]; then
  echo "[boot] restoring database from state file..."
  if node /app/boot-restore.mjs; then
    echo "[boot] database restored OK"
  else
    echo "[boot] restore failed, starting with a fresh database"
  fi
else
  echo "[boot] STATE_PASSPHRASE not set, starting with a fresh database"
fi
exec node dev/run-standalone.mjs
