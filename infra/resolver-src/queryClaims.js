import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.listId || ctx.stash.skipClaims) {
    ctx.stash.claims = [];
    runtime.earlyReturn({ items: [] });
  }
  const values = { ":listId": ctx.stash.listId };
  let expression = "listId = :listId";
  const names = {};
  if (ctx.stash.giftId) {
    expression = "listId = :listId AND begins_with(#sk, :sk)";
    values[":sk"] = ctx.stash.giftId + "#";
    names["#sk"] = "sk";
  }
  const query = {
    expression: expression,
    expressionValues: util.dynamodb.toMapValues(values),
  };
  if (ctx.stash.giftId) query.expressionNames = names;
  return { operation: "Query", query: query, limit: 100 };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  if ((ctx.info.fieldName === "deleteList" || ctx.info.fieldName === "removeChild") && items.length > LIMITS.deleteClaims) {
    util.error("This list has more than " + LIMITS.deleteClaims + " claim slots. Delete some gifts first.");
  }
  ctx.stash.claims = items;
  return items;
}
