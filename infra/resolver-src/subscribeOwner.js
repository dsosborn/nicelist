import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (!canManage(ctx.stash.list, ctx.stash.userId)) {
    util.error("This list wasn't found.");
  }
  runtime.earlyReturn({ ok: true });
}

export function response() {
  return { ok: true };
}
