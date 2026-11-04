import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const gift = ctx.stash.gift;
  if (!gift) runtime.earlyReturn(null);
  const ids = [];
  for (let i = 0; i < gift.quantity; i++) ids.push(util.autoId());
  const slots = claimSlots(gift.id, gift.quantity, ids);
  ctx.stash.slots = slots;
  const rows = [];
  for (let i = 0; i < slots.length; i++) {
    rows.push(
      util.dynamodb.toMapValues({
        listId: ctx.stash.list.id,
        sk: slots[i].sk,
        giftId: gift.id,
        slot: slots[i].slot,
        status: "OPEN",
        claimId: slots[i].claimId,
      }),
    );
  }
  const tables = {};
  tables[tbl("claims")] = rows;
  return { operation: "BatchPutItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = ownerGiftView(ctx.stash.gift, [], false);
  return ctx.stash.result;
}
