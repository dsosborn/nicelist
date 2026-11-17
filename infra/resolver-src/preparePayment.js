import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const field = ctx.info.fieldName;
  if (field === "startPayoutOnboarding") {
    ctx.stash.payment = {
      action: "onboard",
      userId: ctx.stash.userId,
      email: ctx.stash.email || "",
    };
    runtime.earlyReturn(ctx.stash.payment);
  }
  if (!ctx.stash.list) util.error("This list wasn't found.");
  if (field === "refundContribution") {
    if (!ctx.stash.list.revealedAt) {
      ctx.stash.payment = {
        action: "refund",
        userId: ctx.stash.userId,
        listId: ctx.stash.list.id,
        contributionId: ctx.args.contributionId,
        revealed: false,
      };
      runtime.earlyReturn(ctx.stash.payment);
    }
    util.error("Contributions can't be refunded after reveal.");
  }
  if (field === "receiveBalance") {
    if (!ctx.stash.list.revealedAt) util.error("Reveal the list before receiving the balance.");
    if (ctx.stash.list.recipientId !== ctx.stash.userId && !canManage(ctx.stash.list, ctx.stash.userId)) {
      util.error("This list wasn't found.");
    }
    ctx.stash.payment = {
      action: "payout",
      userId: ctx.stash.userId,
      listId: ctx.stash.list.id,
    };
    runtime.earlyReturn(ctx.stash.payment);
  }
  const locked = seasonLockError(ctx.stash.list);
  if (locked) util.error(locked);
  const err = openListError(ctx.stash.list, ctx.stash.userId, ctx.stash.friendIds || []);
  if (err) util.error(err);
  const gift = findGift(ctx.stash.gifts, ctx.args.giftId);
  if (!gift) util.error("This gift wasn't found.");
  if (gift.kind !== "CUSTOM" || !gift.goalCents) util.error("This gift isn't collecting money.");
  if (typeof ctx.args.amountCents !== "number" || ctx.args.amountCents < 50) {
    util.error("Contribution amount is invalid.");
  }
  ctx.stash.payment = {
    action: "checkout",
    userId: ctx.stash.userId,
    email: ctx.stash.email || "",
    listId: ctx.stash.list.id,
    giftId: gift.id,
    giftTitle: gift.title || "A gift",
    amountCents: ctx.args.amountCents,
    shopperName: profileName(ctx),
  };
  runtime.earlyReturn(ctx.stash.payment);
}

export function response(ctx) {
  return ctx.stash.payment;
}
