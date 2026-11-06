import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    index: "senderId-index",
    query: {
      expression: "senderId = :senderId",
      expressionValues: util.dynamodb.toMapValues({ ":senderId": ctx.args.userId }),
    },
    limit: 50,
  };
}

export function response(ctx) {
  const me = ctx.stash.userId;
  const rows = itemsOf(ctx.result).filter((row) => {
    const managers = row.managerIds || (row.ownerId ? [row.ownerId] : []);
    return contains(managers, me);
  });
  ctx.stash.pokes = (ctx.stash.pokes || []).concat(rows);
  return rows;
}
