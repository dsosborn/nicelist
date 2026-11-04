import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const lists = ctx.stash.myLists || [];
  let chosen = null;
  for (let i = 0; i < lists.length; i++) {
    if (lists[i].revealedAt && lists[i].recipientId === ctx.stash.userId) chosen = lists[i];
  }
  if (!chosen) {
    ctx.stash.claims = [];
    ctx.stash.listId = null;
    runtime.earlyReturn({ items: [] });
  }
  ctx.stash.listId = chosen.id;
  ctx.stash.skipClaims = false;
  return {
    operation: "Query",
    query: {
      expression: "listId = :listId",
      expressionValues: util.dynamodb.toMapValues({ ":listId": chosen.id }),
    },
    limit: 100,
  };
}

export function response(ctx) {
  ctx.stash.claims = itemsOf(ctx.result);
  return ctx.stash.claims;
}
