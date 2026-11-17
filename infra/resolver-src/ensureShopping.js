import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const rows = ctx.stash.rows || [];
  const year = shoppingActiveYear(rows, ctx.stash.profile);
  ctx.stash.activeYear = year;
  const sk = shoppingListKey(year);
  const existing = rows.find((row) => row.sk === sk);
  if (existing) runtime.earlyReturn(existing);
  if (year === 2026) {
    const legacy = rows.find((row) => row.sk === "LIST");
    if (legacy) runtime.earlyReturn(legacy);
  }
  const name = "Christmas " + year;
  ctx.stash.createdListName = name;
  ctx.stash.createdListSk = sk;
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ shopperId: ctx.stash.userId, sk: sk }),
    attributeValues: util.dynamodb.toMapValues({ name: name, year: year }),
    condition: { expression: "attribute_not_exists(sk)" },
  };
}

export function response(ctx) {
  const rows = ctx.stash.rows || [];
  const sk = ctx.stash.createdListSk;
  if (sk && !rows.find((row) => row.sk === sk)) {
    rows.push({ sk: sk, name: ctx.stash.createdListName, year: ctx.stash.activeYear });
  }
  ctx.stash.rows = rows;
  return rows;
}
