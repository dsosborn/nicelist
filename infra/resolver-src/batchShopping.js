import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.rows || [];
  const field = ctx.info.fieldName;
  const keys = rows
    .filter((row) => {
      if (field === "deleteShoppingList") return true;
      if (field === "removeShoppingPerson") {
        return (
          row.sk === "PERSON#" + ctx.args.personId ||
          row.sk.indexOf("PLAN#" + ctx.args.personId + "#") === 0
        );
      }
      return false;
    })
    .map((row) => util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: row.sk }));
  ctx.stash.shoppingDeleteKeys = keys;
  const slice = keys.slice(0, 25);
  if (!slice.length) runtime.earlyReturn({ ok: true });
  if (keys.length > 50) util.error("That's more than 50 items to remove at once.");
  const tables = {};
  tables[tbl("shopping")] = slice;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
