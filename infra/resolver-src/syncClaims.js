import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const change = ctx.stash.claimChange || { put: [], remove: [] };
  if (!change.put.length && !change.remove.length) runtime.earlyReturn({ ok: true });
  if (change.put.length) {
    const ids = [];
    for (let i = 0; i < change.put.length; i++) ids.push(util.autoId());
    const rows = [];
    for (let i = 0; i < change.put.length; i++) {
      rows.push(
        util.dynamodb.toMapValues({
          listId: ctx.stash.list.id,
          sk: change.put[i].sk,
          giftId: change.put[i].giftId,
          slot: change.put[i].slot,
          status: "OPEN",
          claimId: ids[i],
        }),
      );
    }
    const tables = {};
    tables[tbl("claims")] = rows;
    return { operation: "BatchPutItem", tables: tables };
  }
  const keys = [];
  for (let i = 0; i < change.remove.length; i++) {
    keys.push(util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: change.remove[i].sk }));
  }
  const tables = {};
  tables[tbl("claims")] = keys;
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = ownerGiftView(ctx.stash.currentGift, [], false);
  return ctx.stash.result;
}
