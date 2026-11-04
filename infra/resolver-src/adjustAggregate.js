import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      recipientId: "AGG",
      sk: normalizeTitle(ctx.stash.rateTitle || ""),
    }),
    update: {
      expression: "ADD ratingCount :one, ratingSum :stars",
      expressionValues: util.dynamodb.toMapValues({
        ":one": 1,
        ":stars": ctx.stash.rateStars,
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
