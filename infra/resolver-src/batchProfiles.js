import { util, runtime } from "@aws-appsync/utils";

function addId(acc, id) {
  if (!id || contains(acc, id)) return acc;
  return acc.concat([id]);
}

export function request(ctx) {
  let ids = [];
  const list = ctx.stash.list;
  if (list) {
    if (!list.isChild) ids = addId(ids, list.recipientId);
    managerIdsOf(list).forEach((id) => {
      ids = addId(ids, id);
    });
  }
  (ctx.stash.myLists || []).forEach((item) => {
    if (!item.isChild) ids = addId(ids, item.recipientId);
  });
  if (ctx.stash.shape !== "myList" || (list && canManage(list, ctx.stash.userId) && list.recipientId !== ctx.stash.userId)) {
    (ctx.stash.claims || []).forEach((claim) => {
      if (claim.status !== "OPEN") ids = addId(ids, claim.shopperId);
    });
  }
  (ctx.stash.pokes || []).forEach((poke) => {
    ids = addId(ids, poke.senderId);
  });
  const trimmed = ids.slice(0, 50);
  if (!trimmed.length) {
    ctx.stash.profiles = {};
    runtime.earlyReturn({ data: {} });
  }
  const keys = trimmed.map((id) => util.dynamodb.toMapValues({ userId: id }));
  const tables = {};
  tables[tbl("profiles")] = { keys: keys, consistentRead: false };
  return { operation: "BatchGetItem", tables: tables };
}

export function response(ctx) {
  const data = ctx.result && ctx.result.data ? ctx.result.data : {};
  const rows = data[tbl("profiles")] || [];
  const map = {};
  rows.forEach((row) => {
    if (row.userId && row.displayName) map[row.userId] = row.displayName;
  });
  ctx.stash.profiles = map;
  if (ctx.info.fieldName === "myLists") {
    const items = ctx.stash.myLists || [];
    ctx.stash.result = items
      .filter((item) => item.shareToken)
      .map((item) => listSummary(item, map));
    return ctx.stash.result;
  }
  return map;
}
