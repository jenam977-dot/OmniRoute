// Downloads the encrypted state file, decrypts it (AES-256-CBC, PBKDF2-SHA256),
// and writes it to $DATA_DIR/storage.sqlite. Exits 0 on success, 1 on failure.
// The matching encryption is: salt(16) + iv(16) + ciphertext.
const fs = require("fs");
const crypto = require("crypto");
(async () => {
  const url = process.env.STATE_URL ||
    "https://raw.githubusercontent.com/jenam977-dot/omniroute-state/main/state.sqlite.enc";
  const pass = process.env.STATE_PASSPHRASE;
  if (!pass) throw new Error("STATE_PASSPHRASE not set");
  const r = await fetch(url);
  if (!r.ok) throw new Error("download HTTP " + r.status);
  const enc = Buffer.from(await r.arrayBuffer());
  if (enc.length < 48) throw new Error("state file too small");
  const key = crypto.pbkdf2Sync(pass, enc.subarray(0, 16), 100000, 32, "sha256");
  const d = crypto.createDecipheriv("aes-256-cbc", key, enc.subarray(16, 32));
  const out = Buffer.concat([d.update(enc.subarray(32)), d.final()]);
  if (out.subarray(0, 6).toString() !== "SQLite") throw new Error("bad magic bytes");
  const dir = process.env.DATA_DIR || "/app/data";
  fs.mkdirSync(dir, { recursive: true });
  for (const s of ["-wal", "-shm"]) { try { fs.unlinkSync(dir + "/storage.sqlite" + s); } catch (e) {} }
  fs.writeFileSync(dir + "/storage.sqlite", out);
  console.log("[boot-restore] wrote " + out.length + " bytes to " + dir + "/storage.sqlite");
})().catch((e) => { console.error("[boot-restore] FAILED: " + e.message); process.exit(1); });
