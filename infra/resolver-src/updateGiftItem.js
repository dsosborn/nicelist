import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  if (ctx.stash.list.revealedAt) util.error("This list is revealed.");
  const locked = seasonLockError(ctx.stash.list);
  if (locked) util.error(locked);
  const current = findGift(ctx.stash.gifts, ctx.args.id);
  if (!current) util.error("This gift wasn't found.");
  const parsed = validateGiftInput({
    kind: current.kind,
    title: ctx.args.title === undefined || ctx.args.title === null ? current.title : ctx.args.title,
    url: ctx.args.url === undefined || ctx.args.url === null ? current.url : ctx.args.url,
    notes: ctx.args.notes === undefined || ctx.args.notes === null ? current.notes : ctx.args.notes,
    price: ctx.args.price === undefined ? current.price : ctx.args.price,
    imageUrl: ctx.args.imageUrl === undefined || ctx.args.imageUrl === null ? current.imageUrl : ctx.args.imageUrl,
    goalCents: ctx.args.goalCents === undefined ? current.goalCents : ctx.args.goalCents,
    quantity: ctx.args.quantity === undefined || ctx.args.quantity === null ? current.quantity : ctx.args.quantity,
    timingPhrase: ctx.args.timingPhrase || current.timingPhrase,
    membershipPhrase: ctx.args.membershipPhrase || current.membershipPhrase,
  });
  if (parsed.error) util.error(parsed.error);
  const change = claimQuantityChange(ctx.stash.claims || [], parsed.value.quantity, current.id, []);
  if (change.error) util.error(change.error);
  ctx.stash.currentGift = current;
  ctx.stash.giftValue = parsed.value;
  ctx.stash.claimChange = change;
  const values = {
    ":title": parsed.value.title,
    ":url": parsed.value.url,
    ":notes": parsed.value.notes,
    ":quantity": parsed.value.quantity,
  };
  let expression = "SET title = :title, #url = :url, notes = :notes, quantity = :quantity";
  if (parsed.value.price !== null && parsed.value.price !== undefined) {
    expression += ", price = :price";
    values[":price"] = parsed.value.price;
  }
  if (parsed.value.imageUrl) {
    expression += ", imageUrl = :imageUrl";
    values[":imageUrl"] = parsed.value.imageUrl;
  }
  if (parsed.value.goalCents) {
    expression += ", goalCents = :goalCents";
    values[":goalCents"] = parsed.value.goalCents;
  }
  if (parsed.value.timingPhrase) {
    expression += ", timingPhrase = :timingPhrase";
    values[":timingPhrase"] = parsed.value.timingPhrase;
  }
  if (parsed.value.membershipPhrase) {
    expression += ", membershipPhrase = :membershipPhrase";
    values[":membershipPhrase"] = parsed.value.membershipPhrase;
  }
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: current.sk }),
    update: {
      expression: expression,
      expressionNames: { "#url": "url" },
      expressionValues: util.dynamodb.toMapValues(values),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const gift = ctx.stash.currentGift;
  const value = ctx.stash.giftValue;
  gift.title = value.title;
  gift.url = value.url;
  gift.notes = value.notes;
  gift.price = value.price;
  gift.imageUrl = value.imageUrl;
  gift.goalCents = value.goalCents;
  gift.listId = ctx.stash.list.id;
  gift.quantity = value.quantity;
  gift.timingPhrase = value.timingPhrase;
  gift.membershipPhrase = value.membershipPhrase;
  return gift;
}
