import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const childId = ctx.args.childId;
  const keys = [
    util.dynamodb.toMapValues({ userId: ctx.stash.userId, sk: "CHILD#" + childId }),
  ];
  const managers = ctx.stash.list ? managerIdsOf(ctx.stash.list) : [ctx.stash.userId];
  for (let i = 0; i < managers.length; i++) {
    keys.push(util.dynamodb.toMapValues({ userId: childId, sk: "MANAGED_BY#" + managers[i] }));
    keys.push(util.dynamodb.toMapValues({ userId: managers[i], sk: "COMANAGER#" + childId }));
    keys.push(util.dynamodb.toMapValues({ userId: managers[i], sk: "CHILD#" + childId }));
  }
  if (!keys.length) runtime.earlyReturn({ ok: true });
  const tables = {};
  tables[tbl("relationships")] = keys.slice(0, 25);
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
