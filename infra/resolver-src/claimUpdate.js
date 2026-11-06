import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  const field = ctx.info.fieldName;
  const sk = slotKey(ctx.args.giftId, ctx.args.slot);
  ctx.stash.currentGift = findGift(ctx.stash.gifts, ctx.args.giftId);
  if (!ctx.stash.currentGift) util.error("This gift wasn't found.");
  if (field === "releaseGift") {
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({ listId: ctx.stash.listId, sk: sk }),
      update: {
        expression: "SET #status = :open REMOVE shopperId, shopperName, shopperNote",
        expressionNames: { "#status": "status" },
        expressionValues: util.dynamodb.toMapValues({ ":open": "OPEN" }),
      },
      condition: {
        expression: "shopperId = :me",
        expressionValues: util.dynamodb.toMapValues({ ":me": ctx.stash.userId }),
      },
    };
  }
  const status = ctx.args.purchased ? "PURCHASED" : "RESERVED";
  ctx.stash.nextStatus = status;
  const values = { ":status": status };
  let expression = "SET #status = :status";
  if (ctx.args.note != null) {
    const check = validateShopperNote(ctx.args.note);
    if (check.error) util.error(check.error);
    ctx.stash.nextNote = clean(ctx.args.note);
    values[":note"] = ctx.stash.nextNote;
    expression = "SET #status = :status, shopperNote = :note";
  }
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.listId, sk: sk }),
    update: {
      expression: expression,
      expressionNames: { "#status": "status" },
      expressionValues: util.dynamodb.toMapValues(values),
    },
    condition: {
      expression: "shopperId = :me",
      expressionValues: util.dynamodb.toMapValues({ ":me": ctx.stash.userId }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error("That gift isn't yours to change.");
  const claims = ctx.stash.claims || [];
  const status = ctx.info.fieldName === "releaseGift" ? "OPEN" : ctx.stash.nextStatus;
  claims.forEach((claim) => {
    if (claim.slot === ctx.args.slot && claim.giftId === ctx.args.giftId) {
      claim.status = status;
      if (status === "OPEN") {
        claim.shopperId = null;
        claim.shopperName = null;
        claim.shopperNote = null;
      } else if (ctx.stash.nextNote != null) {
        claim.shopperNote = ctx.stash.nextNote;
      }
    }
  });
  ctx.stash.result = shopperGiftView(
    ctx.stash.currentGift,
    claims,
    ctx.stash.userId,
    ctx.stash.associateTag,
    false,
  );
  return ctx.stash.result;
}
