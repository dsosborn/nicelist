import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const stars = ctx.args.stars;
  if (stars < 1 || stars > 5) util.error("Rate from 1 to 5 stars.");
  ctx.stash.rateStars = stars;
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      recipientId: ctx.stash.userId,
      sk: "INBOX#" + ctx.args.id,
    }),
  };
}

export function response(ctx) {
  if (!ctx.result) util.error("That gift wasn't found.");
  ctx.stash.rateTitle = ctx.result.title || "A gift";
  ctx.stash.result = {
    id: ctx.args.id,
    title: ctx.stash.rateTitle,
    stars: ctx.stash.rateStars,
    ratingLine: null,
  };
  return ctx.result;
}
