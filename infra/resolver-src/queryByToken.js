import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    index: "shareToken-index",
    query: {
      expression: "shareToken = :token",
      expressionValues: util.dynamodb.toMapValues({ ":token": ctx.args.token }),
    },
    limit: 1,
  };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  const list = items.length ? items[0] : null;
  if (!list) {
    ctx.stash.notFound = true;
    ctx.stash.list = null;
    return null;
  }
  ctx.stash.list = list;
  ctx.stash.listId = list.id;
  if (ctx.stash.shape === "guest" && list.visibility !== "PUBLIC") {
    ctx.stash.notFound = true;
    ctx.stash.list = null;
  }
  if (ctx.stash.shape === "shop") ctx.stash.needsFriends = true;
  return list;
}
