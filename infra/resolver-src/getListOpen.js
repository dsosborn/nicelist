import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ id: ctx.args.listId }),
  };
}

export function response(ctx) {
  const list = ctx.result;
  if (!list) {
    ctx.stash.notFound = true;
    util.error("This list wasn't found.");
  }
  ctx.stash.list = list;
  ctx.stash.listId = list.id;
  ctx.stash.needsFriends = !canManage(list, ctx.stash.userId);
  return list;
}
