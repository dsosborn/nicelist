import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    query: {
      expression: "shopperId = :shopperId",
      expressionValues: util.dynamodb.toMapValues({ ":shopperId": ctx.stash.userId }),
    },
    limit: 200,
  };
}

export function response(ctx) {
  ctx.stash.rows = itemsOf(ctx.result);
  return ctx.stash.rows;
}
