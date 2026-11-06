import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const ideas = ctx.stash.ideaResult && ctx.stash.ideaResult.ideas ? ctx.stash.ideaResult.ideas : [];
  if (!ideas.length) runtime.earlyReturn([]);
  const keys = ideas.slice(0, 8).map((idea) =>
    util.dynamodb.toMapValues({ recipientId: "AGG", sk: normalizeTitle(idea.title) }),
  );
  const tables = {};
  tables[tbl("ratings")] = { keys: keys, consistentRead: false };
  return { operation: "BatchGetItem", tables: tables };
}

export function response(ctx) {
  const ideas = ctx.stash.ideaResult && ctx.stash.ideaResult.ideas ? ctx.stash.ideaResult.ideas : [];
  const data = ctx.result && ctx.result.data ? ctx.result.data : {};
  const rows = (data[tbl("ratings")] || []).filter((item) => item);
  const lines = {};
  rows.forEach((row) => {
    lines[row.sk] = ratingLine(row.ratingCount, row.ratingSum);
  });
  ideas.forEach((idea) => {
    idea.ratingLine = lines[normalizeTitle(idea.title)] || null;
  });
  ctx.stash.ideaResult = { ideas: ideas, message: ctx.stash.ideaResult.message };
  return ctx.stash.ideaResult;
}
