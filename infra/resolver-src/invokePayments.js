import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "Invoke",
    payload: ctx.stash.payment || { action: "none" },
  };
}

export function response(ctx) {
  const result = ctx.result || {};
  if (result.error) util.error(result.error);
  const field = ctx.info.fieldName;
  if (field === "refundContribution" || field === "receiveBalance") {
    ctx.stash.result = true;
    return true;
  }
  if (!result.url) util.error("Payments are not configured.");
  ctx.stash.checkout = { url: result.url };
  return ctx.stash.checkout;
}
