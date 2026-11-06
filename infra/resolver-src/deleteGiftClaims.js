import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.claims || [];
  if (!rows.length) runtime.earlyReturn({ ok: true });
  if (rows.length > 25) util.error("This gift is too large to delete at once.");
  const keys = rows.map((row) => util.dynamodb.toMapValues({ listId: ctx.stash.listId, sk: row.sk }));
  const tables = {};
  tables[tbl("claims")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
