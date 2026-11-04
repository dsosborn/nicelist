import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domainStart = fs.readFileSync(path.join(root, "domain/rules.mjs"), "utf8");
const exportAt = domainStart.lastIndexOf("\nexport {");
const domain = (exportAt === -1 ? domainStart : domainStart.slice(0, exportAt))
  .replace(/^export /gm, "");

const preamble = `
const PREFIX = "\${name_prefix}";
function tbl(name) {
  return PREFIX + "-" + name;
}
function defined(obj) {
  const out = {};
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== null) out[keys[i]] = obj[keys[i]];
  }
  return out;
}
function itemsOf(result) {
  return result && result.items ? result.items : [];
}
function findGift(gifts, id) {
  const rows = gifts || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  return null;
}
function profileName(ctx) {
  if (ctx.stash.profile && ctx.stash.profile.displayName) return ctx.stash.profile.displayName;
  return displayNameFrom(ctx.stash.givenName, ctx.stash.email);
}
`;

const srcDir = path.join(root, "resolver-src");
const outDir = path.join(root, "resolvers/built");
fs.mkdirSync(outDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
  if (!file.endsWith(".js")) continue;
  const source = fs.readFileSync(path.join(srcDir, file), "utf8");
  const imports = [];
  const body = [];
  for (const line of source.split("\n")) {
    if (line.startsWith("import ")) imports.push(line);
    else body.push(line);
  }
  const bundled = `${imports.join("\n")}\n${domain}\n${preamble}\n${body.join("\n")}`;
  fs.writeFileSync(path.join(outDir, file), bundled);
}

console.log("bundled", fs.readdirSync(outDir).length, "resolvers");
