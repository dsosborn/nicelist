import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      recipientId: ctx.stash.userId,
      sk: "RATE#" + ctx.args.id,
    }),
    attributeValues: util.dynamodb.toMapValues({
      stars: ctx.stash.rateStars,
      title: ctx.stash.rateTitle,
      titleNorm: normalizeTitle(ctx.stash.rateTitle || ""),
    }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
