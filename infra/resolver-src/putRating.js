import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const stars = ctx.args.stars;
  if (stars < 1 || stars > 5) util.error("Rate from 1 to 5 stars.");
  const claims = ctx.stash.claims || [];
  let purchased = false;
  let title = "A gift";
  for (let i = 0; i < claims.length; i++) {
    if (claims[i].status === "PURCHASED") {
      purchased = true;
      if (claims[i].title) title = claims[i].title;
    }
  }
  const gift = findGift(ctx.stash.gifts, ctx.args.giftId);
  if (gift && gift.title) title = gift.title;
  if (!purchased) util.error("You can rate a gift after it is purchased.");
  ctx.stash.rateTitle = title;
  ctx.stash.rateStars = stars;
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      recipientId: ctx.stash.list.recipientId,
      sk: "RATE#" + ctx.args.giftId,
    }),
    attributeValues: util.dynamodb.toMapValues({
      stars: stars,
      title: title,
      titleNorm: normalizeTitle(title),
    }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = {
    id: ctx.args.giftId,
    title: ctx.stash.rateTitle,
    stars: ctx.stash.rateStars,
    ratingLine: null,
  };
  return ctx.stash.result;
}
