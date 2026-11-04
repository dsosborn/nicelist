import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const recipientId = ctx.args.childId || ctx.args.refId || (ctx.stash.person && ctx.stash.person.refId);
  ctx.stash.recipientId = recipientId || "";
  if (!recipientId) {
    return {
      operation: "Query",
      index: "recipientId-index",
      query: {
        expression: "recipientId = :recipientId",
        expressionValues: util.dynamodb.toMapValues({ ":recipientId": "none" }),
      },
      limit: 1,
    };
  }
  return {
    operation: "Query",
    index: "recipientId-index",
    query: {
      expression: "recipientId = :recipientId",
      expressionValues: util.dynamodb.toMapValues({ ":recipientId": recipientId }),
    },
    limit: 10,
  };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  let chosen = null;
  for (let i = 0; i < items.length; i++) {
    const list = items[i];
    if (ctx.args.childId && !canManage(list, ctx.stash.userId)) continue;
    if (ctx.stash.person && ctx.stash.person.kind === "CHILD" && !canManage(list, ctx.stash.userId)) continue;
    if (ctx.stash.person && ctx.stash.person.kind === "FRIEND") {
      if (list.visibility === "PRIVATE") continue;
      if (list.visibility === "FRIENDS" && !contains(ctx.stash.friendIds || [], list.ownerId) && !contains(list.managerIds || [], ctx.stash.userId)) {
        continue;
      }
    }
    chosen = list;
  }
  if (ctx.args.childId && !chosen) util.error("This child wasn't found.");
  if (chosen) {
    ctx.stash.list = chosen;
    ctx.stash.listId = chosen.id;
    ctx.stash.skipClaims = false;
  }
  ctx.stash.recipientLists = items;
  return items;
}
