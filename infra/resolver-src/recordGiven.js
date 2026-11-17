import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.info.fieldName !== "setPurchased" || !ctx.args.personId || ctx.stash.nextStatus !== "PURCHASED") {
    runtime.earlyReturn(null);
  }
  const year = ctx.stash.activeYear || activeYearOf(ctx.stash.profile);
  const gift = ctx.stash.currentGift || {};
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      shopperId: ctx.stash.userId,
      sk: givenKey(year, ctx.args.personId, ctx.args.giftId + "#" + ctx.args.slot),
    }),
    attributeValues: util.dynamodb.toMapValues({
      personId: ctx.args.personId,
      claimId: ctx.args.giftId + "#" + ctx.args.slot,
      title: gift.title || "A gift",
      price: typeof gift.price === "number" ? gift.price : 0,
      on: false,
    }),
  };
}

export function response(ctx) {
  return ctx.stash.result;
}
