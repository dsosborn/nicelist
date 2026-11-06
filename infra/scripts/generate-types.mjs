import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaPath = path.join(root, "infra/schema.graphql");
const outPath = path.join(root, "apps/frontend/src/graphql/generated.ts");

const cleaned = fs
  .readFileSync(schemaPath, "utf8")
  .replace(/@aws_cognito_user_pools/g, "")
  .replace(/@aws_api_key/g, "");

const scalars = {
  ID: "string",
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
};

function tsType(raw) {
  const trimmed = raw.trim();
  const nonNull = trimmed.endsWith("!");
  const inner = nonNull ? trimmed.slice(0, -1).trim() : trimmed;
  let base;
  if (inner.startsWith("[") && inner.endsWith("]")) {
    base = `${tsType(inner.slice(1, -1))}[]`;
  } else {
    base = scalars[inner] || inner;
  }
  return nonNull ? base : `${base} | null`;
}

const out = [
  "// Generated from infra/schema.graphql by infra/scripts/generate-types.mjs. Do not edit by hand.",
  "",
];

const enumRe = /enum\s+(\w+)\s*\{([^}]*)\}/g;
let match;
while ((match = enumRe.exec(cleaned)) !== null) {
  const name = match[1];
  const values = match[2]
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean);
  out.push(`export type ${name} = ${values.map((v) => `"${v}"`).join(" | ")};`);
}
out.push("");

const typeRe = /type\s+(\w+)\s*\{([^}]*)\}/g;
while ((match = typeRe.exec(cleaned)) !== null) {
  const name = match[1];
  if (name === "Query" || name === "Mutation") continue;
  const body = match[2];
  out.push(`export type ${name} = {`);
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fieldMatch = /^(\w+)\s*:\s*(.+)$/.exec(line);
    if (!fieldMatch) continue;
    out.push(`  ${fieldMatch[1]}: ${tsType(fieldMatch[2])};`);
  }
  out.push("};", "");
}

const nextText = out.join("\n");
if (process.argv.includes("--check")) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (current !== nextText) {
    console.error("apps/frontend/src/graphql/generated.ts is out of sync with infra/schema.graphql");
    process.exit(1);
  }
  console.log("generated.ts in sync");
} else {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, nextText);
  console.log("wrote", outPath);
}
