import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (!canShop(ctx.stash.list, ctx.stash.userId, ctx.stash.friendIds || [])) {
    util.error("This list wasn't found.");
  }
  runtime.earlyReturn({ ok: true });
}

export function response() {
  return { ok: true };
}
