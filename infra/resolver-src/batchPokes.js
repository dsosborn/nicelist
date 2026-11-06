import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.pokes || [];
  const slice = rows.slice(0, 25);
  if (!slice.length || ctx.stash.notFound) runtime.earlyReturn({ unprocessedItems: {} });
  const keys = slice.map((row) =>
    util.dynamodb.toMapValues({ listId: row.listId || ctx.stash.listId, sk: row.sk }),
  );
  const tables = {};
  tables[tbl("pokes")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
