import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const keys = ctx.stash.shoppingDeleteKeys || [];
  const slice = keys.slice(25, 50);
  if (!slice.length) runtime.earlyReturn({ ok: true });
  const tables = {};
  tables[tbl("shopping")] = slice;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
