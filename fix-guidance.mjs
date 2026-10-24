// Her guidance: "bring them back to theirs" -> once, not in every reply (2026-10-24, Aaron).
// MEASURED 19:04: "How long does it take to heal?" and "Who was the first president?" were each answered and then
// "Still thinking about that Thunderbird tattoo?" - every reply, because her guidance says "bring them back to theirs".
// Reads cognition:prompts, changes that one phrase in tattoo_talk, keeps a backup, writes it back. Prints before and after.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const NS = "9c2ba111589e48c6ba5ad1b924ae8809";
const KEY = "cognition:prompts";
const raw = execSync(`npx wrangler kv key get --namespace-id ${NS} "${KEY}" --remote`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const start = raw.indexOf("{");
const all = JSON.parse(raw.slice(start));
const v = all && all.tattoo_talk;
if (typeof v !== "string") { console.log("NO tattoo_talk in " + KEY + " - nothing changed"); process.exit(1); }

const OLD = /,?\s*and bring them back to theirs\.?/i;
const NEW = ". Bring them back to their tattoo once - not in every reply. If they keep asking about other things, just answer.";
const m = v.match(OLD);
if (!m) {
  const i = v.search(/bring them back/i);
  console.log("The phrase was not found - nothing changed. Nearest text: " + (i >= 0 ? JSON.stringify(v.slice(Math.max(0, i - 200), i + 200)) : "(no 'bring them back' at all)"));
  process.exit(1);
}
const at = m.index;
console.log("BEFORE: " + JSON.stringify(v.slice(Math.max(0, at - 160), at + m[0].length + 20)));
const out = v.replace(OLD, NEW);
console.log("AFTER:  " + JSON.stringify(out.slice(Math.max(0, at - 160), at + NEW.length + 20)));

writeFileSync("prompts-backup.json", raw.slice(start), "utf8");
all.tattoo_talk = out;
writeFileSync("prompts-after.json", JSON.stringify(all), "utf8");
execSync(`npx wrangler kv key put --namespace-id ${NS} "${KEY}" --path prompts-after.json --remote`, { stdio: "inherit" });
console.log("WRITTEN. tattoo_talk " + v.length + " -> " + out.length + " chars. Backup: prompts-backup.json");
