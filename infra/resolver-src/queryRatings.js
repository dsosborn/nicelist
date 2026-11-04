import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const recipientId = ctx.stash.list ? ctx.stash.list.recipientId : ctx.stash.userId;
  if (ctx.stash.notFound) runtime.earlyReturn({ items: [] });
  return {
    operation: "Query",
    query: {
      expression: "recipientId = :recipientId",
      expressionValues: util.dynamodb.toMapValues({ ":recipientId": recipientId }),
    },
    limit: 100,
  };
}

export function response(ctx) {
  ctx.stash.ratingRows = itemsOf(ctx.result);
  if (ctx.stash.shape === "received") {
    const inbox = [];
    for (let i = 0; i < ctx.stash.ratingRows.length; i++) {
      const row = ctx.stash.ratingRows[i];
      if (row.sk.indexOf("INBOX#") === 0) inbox.push(row);
    }
    ctx.stash.received = shapeReceived(
      ctx.stash.gifts || [],
      ctx.stash.claims || [],
      inbox,
      ctx.stash.ratingRows,
    );
  }
  return ctx.stash.ratingRows;
}
