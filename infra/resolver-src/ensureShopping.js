import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.rows || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].sk === "LIST") runtime.earlyReturn(rows[i]);
  }
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: "LIST" }),
    attributeValues: util.dynamodb.toMapValues({ name: "Christmas 2026" }),
    condition: { expression: "attribute_not_exists(sk)" },
  };
}

export function response(ctx) {
  const rows = ctx.stash.rows || [];
  let found = false;
  for (let i = 0; i < rows.length; i++) if (rows[i].sk === "LIST") found = true;
  if (!found) rows.push({ sk: "LIST", name: "Christmas 2026" });
  ctx.stash.rows = rows;
  return rows;
}
