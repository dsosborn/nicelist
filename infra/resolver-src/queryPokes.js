import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.listId) {
    ctx.stash.pokes = [];
    runtime.earlyReturn({ items: [] });
  }
  return {
    operation: "Query",
    query: {
      expression: "listId = :listId",
      expressionValues: util.dynamodb.toMapValues({ ":listId": ctx.stash.listId }),
    },
    limit: 50,
  };
}

export function response(ctx) {
  ctx.stash.pokes = itemsOf(ctx.result);
  return ctx.stash.pokes;
}
