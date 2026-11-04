import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.rows || [];
  const keys = [];
  const field = ctx.info.fieldName;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (field === "deleteShoppingList") {
      keys.push(util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: row.sk }));
    } else if (field === "removeShoppingPerson") {
      if (row.sk === "PERSON#" + ctx.args.personId || row.sk.indexOf("PLAN#" + ctx.args.personId + "#") === 0) {
        keys.push(util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: row.sk }));
      }
    }
  }
  if (!keys.length) runtime.earlyReturn({ ok: true });
  if (keys.length > 25) util.error("That's too much to remove at once.");
  const tables = {};
  tables[tbl("shopping")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
