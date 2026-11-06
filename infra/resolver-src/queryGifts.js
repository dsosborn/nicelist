import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.listId) {
    ctx.stash.gifts = [];
    runtime.earlyReturn({ items: [] });
  }
  if (ctx.stash.shape === "shop" && !canShop(ctx.stash.list, ctx.stash.userId, ctx.stash.friendIds || [])) {
    ctx.stash.notFound = true;
    ctx.stash.list = null;
    ctx.stash.gifts = [];
    runtime.earlyReturn({ items: [] });
  }
  return {
    operation: "Query",
    query: {
      expression: "listId = :listId",
      expressionValues: util.dynamodb.toMapValues({ ":listId": ctx.stash.listId }),
    },
    limit: 100,
  };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  if ((ctx.info.fieldName === "deleteList" || ctx.info.fieldName === "removeChild") && items.length > LIMITS.deleteGifts) {
    util.error("This list has more than " + LIMITS.deleteGifts + " gifts. Delete some gifts first.");
  }
  ctx.stash.gifts = items;
  return items;
}
