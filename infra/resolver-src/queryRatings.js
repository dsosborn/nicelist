import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound) runtime.earlyReturn({ items: [] });
  if (ctx.stash.shape === "received" && !ctx.stash.listId) {
    ctx.stash.received = [];
    runtime.earlyReturn({ items: [] });
  }
  const recipientId = ctx.stash.list ? ctx.stash.list.recipientId : ctx.stash.userId;
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
    const inbox = ctx.stash.ratingRows.filter((row) => row.sk.indexOf("INBOX#") === 0);
    ctx.stash.received = shapeReceived(
      ctx.stash.gifts || [],
      ctx.stash.claims || [],
      inbox,
      ctx.stash.ratingRows,
      !!ctx.stash.listId,
    );
  }
  return ctx.stash.ratingRows;
}
