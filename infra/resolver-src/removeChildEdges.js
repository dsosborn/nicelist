import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const childId = ctx.args.childId;
  const keys = [
    util.dynamodb.toMapValues({ userId: ctx.stash.userId, sk: "CHILD#" + childId }),
  ];
  const managers = ctx.stash.list ? managerIdsOf(ctx.stash.list) : [ctx.stash.userId];
  const extra = managers.reduce((acc, managerId) => {
    return acc.concat([
      util.dynamodb.toMapValues({ userId: childId, sk: "MANAGED_BY#" + managerId }),
      util.dynamodb.toMapValues({ userId: managerId, sk: "COMANAGER#" + childId }),
      util.dynamodb.toMapValues({ userId: managerId, sk: "CHILD#" + childId }),
    ]);
  }, []);
  const allKeys = keys.concat(extra);
  if (!allKeys.length) runtime.earlyReturn({ ok: true });
  const tables = {};
  tables[tbl("relationships")] = allKeys.slice(0, 25);
  return { operation: "BatchDeleteItem", tables: tables };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
