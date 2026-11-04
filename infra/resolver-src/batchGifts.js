import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.gifts || [];
  if (!rows.length || ctx.stash.notFound) runtime.earlyReturn({ unprocessedItems: {} });
  const keys = [];
  for (let i = 0; i < rows.length && i < 25; i++) {
    keys.push(util.dynamodb.toMapValues({ listId: ctx.stash.listId, sk: rows[i].sk }));
  }
  const tables = {};
  tables[tbl("gifts")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
