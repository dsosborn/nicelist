import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const change = ctx.stash.claimChange || { put: [], remove: [] };
  if (!change.put.length && !change.remove.length) runtime.earlyReturn({ ok: true });
  if (change.put.length) {
    const rows = change.put.map((slot) =>
      util.dynamodb.toMapValues({
        listId: ctx.stash.list.id,
        sk: slot.sk,
        giftId: slot.giftId,
        slot: slot.slot,
        status: "OPEN",
        claimId: util.autoId(),
      }),
    );
    const tables = {};
    tables[tbl("claims")] = rows;
    return { operation: "BatchPutItem", tables: tables };
  }
  const keys = change.remove.map((slot) =>
    util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: slot.sk }),
  );
  const tables = {};
  tables[tbl("claims")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = ownerGiftView(ctx.stash.currentGift, [], false);
  return ctx.stash.result;
}
