import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (!ctx.stash.list || !ctx.stash.list.id) {
    ctx.stash.contributions = [];
    runtime.earlyReturn({ items: [] });
  }
  return {
    operation: "Query",
    query: {
      expression: "listId = :listId",
      expressionValues: util.dynamodb.toMapValues({ ":listId": ctx.stash.list.id }),
    },
  };
}

export function response(ctx) {
  ctx.stash.contributions = itemsOf(ctx.result);
  return ctx.stash.contributions;
}
