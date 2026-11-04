import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  const choice = pickReserve(ctx.stash.claims || [], ctx.stash.userId);
  ctx.stash.choice = choice;
  const gift = findGift(ctx.stash.gifts, ctx.stash.giftId);
  if (!gift) util.error("This gift wasn't found.");
  ctx.stash.currentGift = gift;
  if (choice.action === "taken") util.error("Already taken.");
  if (choice.action === "return") {
    ctx.stash.result = shopperGiftView(gift, ctx.stash.claims, ctx.stash.userId, ctx.stash.associateTag, false);
    runtime.earlyReturn(ctx.stash.result);
  }
  const note = validateShopperNote(ctx.args.note || "");
  if (note.error) util.error(note.error);
  ctx.stash.note = note.value;
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      listId: ctx.stash.listId,
      sk: slotKey(ctx.stash.giftId, choice.slot),
    }),
    update: {
      expression:
        "SET #status = :reserved, shopperId = :shopperId, shopperName = :shopperName, shopperNote = :shopperNote",
      expressionNames: { "#status": "status" },
      expressionValues: util.dynamodb.toMapValues({
        ":reserved": "RESERVED",
        ":shopperId": ctx.stash.userId,
        ":shopperName": profileName(ctx),
        ":shopperNote": note.value,
      }),
    },
    condition: {
      expression: "#status = :open",
      expressionNames: { "#status": "status" },
      expressionValues: util.dynamodb.toMapValues({ ":open": "OPEN" }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error("Already taken.");
  const claims = ctx.stash.claims || [];
  const choice = ctx.stash.choice;
  for (let i = 0; i < claims.length; i++) {
    if (claims[i].slot === choice.slot) {
      claims[i].status = "RESERVED";
      claims[i].shopperId = ctx.stash.userId;
      claims[i].shopperName = profileName(ctx);
      claims[i].shopperNote = ctx.stash.note;
    }
  }
  ctx.stash.result = shopperGiftView(
    ctx.stash.currentGift,
    claims,
    ctx.stash.userId,
    ctx.stash.associateTag,
    false,
  );
  return ctx.stash.result;
}
