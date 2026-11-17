import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const url = clean(ctx.args.imageUrl);
  if (!url) {
    return { operation: "Invoke", payload: { action: "copy", url: "" } };
  }
  return { operation: "Invoke", payload: { action: "copy", url: url } };
}

export function response(ctx) {
  if (ctx.error) {
    ctx.stash.copiedImage = null;
    return null;
  }
  const result = ctx.result || {};
  ctx.stash.copiedImage = result.imageUrl || null;
  return ctx.stash.copiedImage;
}
