import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const delta = ratingDelta(ctx.stash.previousStars, ctx.stash.rateStars);
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      recipientId: "AGG",
      sk: normalizeTitle(ctx.stash.rateTitle || ""),
    }),
    update: {
      expression: "ADD ratingCount :countDelta, ratingSum :sumDelta",
      expressionValues: util.dynamodb.toMapValues({
        ":countDelta": delta.countDelta,
        ":sumDelta": delta.sumDelta,
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  if (ctx.stash.result && ctx.result) {
    ctx.stash.result.ratingLine = ratingLine(ctx.result.ratingCount, ctx.result.ratingSum);
  }
  return ctx.stash.result;
}
