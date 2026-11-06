import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const stars = ctx.args.stars;
  if (stars < 1 || stars > 5) util.error("Rate from 1 to 5 stars.");
  const purchasedClaims = (ctx.stash.claims || []).filter((claim) => claim.status === "PURCHASED");
  const purchased = purchasedClaims.length > 0;
  const fromClaims = purchasedClaims.reduce((acc, claim) => (claim.title ? claim.title : acc), "A gift");
  const gift = findGift(ctx.stash.gifts, ctx.args.giftId);
  const title = gift && gift.title ? gift.title : fromClaims;
  if (!purchased) util.error("You can rate a gift after it is purchased.");
  ctx.stash.rateTitle = title;
  ctx.stash.rateStars = stars;
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      recipientId: ctx.stash.list.recipientId,
      sk: "RATE#" + ctx.args.giftId,
    }),
    update: {
      expression: "SET stars = :stars, title = :title, titleNorm = :titleNorm",
      expressionValues: util.dynamodb.toMapValues({
        ":stars": stars,
        ":title": title,
        ":titleNorm": normalizeTitle(title),
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const existing = (ctx.stash.ratingRows || []).find(
    (row) => row.sk === "RATE#" + ctx.args.giftId,
  );
  ctx.stash.previousStars = existing ? existing.stars : null;
  ctx.stash.result = {
    id: ctx.args.giftId,
    title: ctx.stash.rateTitle,
    source: "WISHLIST",
    stars: ctx.stash.rateStars,
    ratingLine: null,
  };
  return ctx.stash.result;
}
