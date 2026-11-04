import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (!ctx.stash.needsFriends && ctx.stash.shape !== "shop") {
    ctx.stash.friendIds = [];
    runtime.earlyReturn({ items: [] });
  }
  if (!ctx.stash.userId) {
    ctx.stash.friendIds = [];
    runtime.earlyReturn({ items: [] });
  }
  return {
    operation: "Query",
    query: {
      expression: "userId = :userId AND begins_with(#sk, :sk)",
      expressionNames: { "#sk": "sk" },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": ctx.stash.userId,
        ":sk": "FRIEND#",
      }),
    },
  };
}

export function response(ctx) {
  ctx.stash.friendIds = friendIdsOf(itemsOf(ctx.result));
  if (ctx.stash.list && (ctx.stash.shape === "shop" || ctx.stash.needsFriends)) {
    if (!canShop(ctx.stash.list, ctx.stash.userId, ctx.stash.friendIds)) {
      if (ctx.info.fieldName === "reserveGift" || ctx.info.fieldName === "setPurchased" || ctx.info.fieldName === "releaseGift") {
        util.error("This list wasn't found.");
      }
      ctx.stash.notFound = true;
      ctx.stash.list = null;
    }
  }
  return ctx.stash.friendIds;
}
