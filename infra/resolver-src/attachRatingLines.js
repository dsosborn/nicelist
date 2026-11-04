import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const ideas = ctx.stash.ideaResult && ctx.stash.ideaResult.ideas ? ctx.stash.ideaResult.ideas : [];
  if (!ideas.length) runtime.earlyReturn([]);
  const keys = [];
  for (let i = 0; i < ideas.length && i < 8; i++) {
    keys.push(util.dynamodb.toMapValues({ recipientId: "AGG", sk: normalizeTitle(ideas[i].title) }));
  }
  const tables = {};
  tables[tbl("ratings")] = { keys: keys, consistentRead: false };
  return { operation: "BatchGetItem", tables: tables };
}

export function response(ctx) {
  const ideas = ctx.stash.ideaResult && ctx.stash.ideaResult.ideas ? ctx.stash.ideaResult.ideas : [];
  const data = ctx.result && ctx.result.data ? ctx.result.data : {};
  const rows = data[tbl("ratings")] || [];
  const lines = {};
  for (let i = 0; i < rows.length; i++) {
    lines[rows[i].sk] = ratingLine(rows[i].ratingCount, rows[i].ratingSum);
  }
  for (let i = 0; i < ideas.length; i++) ideas[i].ratingLine = lines[normalizeTitle(ideas[i].title)] || null;
  ctx.stash.ideaResult = { ideas: ideas, message: ctx.stash.ideaResult.message };
  return ctx.stash.ideaResult;
}
