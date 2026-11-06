import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const gift = ctx.stash.gift;
  if (!gift) runtime.earlyReturn(null);
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .filter((slot) => slot <= gift.quantity)
    .map(() => util.autoId());
  const slots = claimSlots(gift.id, gift.quantity, ids);
  ctx.stash.slots = slots;
  const rows = slots.map((slot) =>
    util.dynamodb.toMapValues({
      listId: ctx.stash.list.id,
      sk: slot.sk,
      giftId: gift.id,
      slot: slot.slot,
      status: "OPEN",
      claimId: slot.claimId,
    }),
  );
  const tables = {};
  tables[tbl("claims")] = rows;
  return { operation: "BatchPutItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = ownerGiftView(ctx.stash.gift, [], false);
  return ctx.stash.result;
}
