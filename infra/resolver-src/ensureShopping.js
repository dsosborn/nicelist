import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.rows || [];
  const existing = rows.find((row) => row.sk === "LIST");
  if (existing) runtime.earlyReturn(existing);
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: "LIST" }),
    attributeValues: util.dynamodb.toMapValues({ name: "Christmas 2026" }),
    condition: { expression: "attribute_not_exists(sk)" },
  };
}

export function response(ctx) {
  const rows = ctx.stash.rows || [];
  if (!rows.find((row) => row.sk === "LIST")) rows.push({ sk: "LIST", name: "Christmas 2026" });
  ctx.stash.rows = rows;
  return rows;
}
