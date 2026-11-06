import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Query",
    index: "senderId-index",
    query: {
      expression: "senderId = :senderId",
      expressionValues: util.dynamodb.toMapValues({ ":senderId": ctx.stash.userId }),
    },
    limit: 50,
  };
}

export function response(ctx) {
  const other = ctx.args.userId;
  const rows = itemsOf(ctx.result).filter((row) => {
    const managers = row.managerIds || (row.ownerId ? [row.ownerId] : []);
    return contains(managers, other);
  });
  ctx.stash.pokes = (ctx.stash.pokes || []).concat(rows);
  return rows;
}
