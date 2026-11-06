import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const infraDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = path.resolve(infraDir, "..");

const raw = execFileSync("terraform", ["-chdir=" + infraDir, "output", "-json"], {
  encoding: "utf8",
});
const out = JSON.parse(raw);
const get = (key) => (out[key] && out[key].value != null ? String(out[key].value) : "");

const lines = [
  `NEXT_PUBLIC_COGNITO_USER_POOL_ID=${get("cognito_user_pool_id")}`,
  `NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=${get("cognito_client_id")}`,
  `NEXT_PUBLIC_COGNITO_REGION=${get("cognito_region") || "us-east-1"}`,
  `NEXT_PUBLIC_APPSYNC_ENDPOINT=${get("appsync_graphql_endpoint")}`,
  `NEXT_PUBLIC_APPSYNC_API_KEY=${get("appsync_api_key")}`,
  `NEXT_PUBLIC_COGNITO_DOMAIN=${get("cognito_hosted_ui_domain")}`,
  "NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/login",
  "NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT=http://localhost:3000/login",
  "",
];

const target = path.join(repoDir, "apps/frontend/.env.local");
fs.writeFileSync(target, lines.join("\n"));
console.log("wrote", target);
