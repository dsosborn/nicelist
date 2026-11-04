import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    index: "ownerId-createdAt",
    query: {
      expression: "ownerId = :ownerId",
      expressionValues: util.dynamodb.toMapValues({ ":ownerId": ctx.stash.userId }),
    },
  };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  ctx.stash.myLists = items;
  const summaries = [];
  for (let i = 0; i < items.length; i++) {
    if (!items[i].shareToken) continue;
    summaries.push(listSummary(items[i]));
  }
  ctx.stash.result = summaries;
  return summaries;
}
