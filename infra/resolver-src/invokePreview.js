import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const url = clean(ctx.args.url);
  if (!url || url.length > LIMITS.url) util.error("Link is too long.");
  return {
    operation: "Invoke",
    payload: { action: "preview", url: url },
  };
}

export function response(ctx) {
  const result = ctx.result || {};
  ctx.stash.preview = {
    title: result.title || null,
    price: typeof result.price === "number" ? result.price : null,
    imageUrl: result.imageUrl || null,
    variantNote: result.variantNote || null,
  };
  return ctx.stash.preview;
}
