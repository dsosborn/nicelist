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
  const summaries = items.filter((item) => item.shareToken).map((item) => listSummary(item));
  ctx.stash.result = summaries;
  return summaries;
}
