import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const stars = ctx.args.stars;
  if (stars < 1 || stars > 5) util.error("Rate from 1 to 5 stars.");
  ctx.stash.rateStars = stars;
  const rows = ctx.stash.ratingRows || [];
  const inbox = rows.find((row) => row.sk === "INBOX#" + ctx.args.id);
  if (!inbox) util.error("That gift wasn't found.");
  const existing = rows.find((row) => row.sk === "RATE#" + ctx.args.id);
  ctx.stash.previousStars = existing ? existing.stars : null;
  ctx.stash.rateTitle = inbox.title || "A gift";
  ctx.stash.result = {
    id: ctx.args.id,
    title: ctx.stash.rateTitle,
    source: "SUGGESTION",
    stars: stars,
    ratingLine: null,
  };
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      recipientId: ctx.stash.userId,
      sk: "RATE#" + ctx.args.id,
    }),
    attributeValues: util.dynamodb.toMapValues({
      stars: stars,
      title: ctx.stash.rateTitle,
      titleNorm: normalizeTitle(ctx.stash.rateTitle),
    }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
