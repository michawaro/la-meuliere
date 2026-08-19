/**
 * Regenerates data/admin-vault.json.
 * Usage: set ADMIN_CODE then: node tools/make-admin-vault.mjs [github-token]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const password = process.env.ADMIN_CODE;
if (!password) {
  console.error("Set ADMIN_CODE");
  process.exit(1);
}
const token = process.argv[2] || process.env.AVAIL_GITHUB_TOKEN || "";
const payload = token
  ? { ok: true, githubToken: token, repo: "michawaro/la-meuliere" }
  : { ok: true };

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const iter = 210000;
const key = crypto.pbkdf2Sync(password, salt, iter, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const enc = Buffer.concat([
  cipher.update(JSON.stringify(payload), "utf8"),
  cipher.final(),
]);
const ct = Buffer.concat([enc, cipher.getAuthTag()]);
const vault = {
  v: 1,
  kdf: "PBKDF2",
  hash: "SHA-256",
  iter,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  ct: ct.toString("base64"),
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "data", "admin-vault.json");
fs.writeFileSync(out, JSON.stringify(vault) + "\n");
console.log("Wrote", out);
