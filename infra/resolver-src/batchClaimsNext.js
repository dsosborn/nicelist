import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.claims || [];
  const slice = rows.slice(25, 50);
  if (!slice.length || ctx.stash.notFound) runtime.earlyReturn({ unprocessedItems: {} });
  const keys = [];
  for (let i = 0; i < slice.length; i++) {
    keys.push(util.dynamodb.toMapValues({ listId: ctx.stash.listId, sk: slice[i].sk }));
  }
  const tables = {};
  tables[tbl("claims")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
