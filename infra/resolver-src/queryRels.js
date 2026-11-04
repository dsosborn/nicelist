import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    query: {
      expression: "userId = :userId",
      expressionValues: util.dynamodb.toMapValues({ ":userId": ctx.stash.userId }),
    },
    limit: 200,
  };
}

export function response(ctx) {
  ctx.stash.rows = itemsOf(ctx.result);
  return ctx.stash.rows;
}
