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
