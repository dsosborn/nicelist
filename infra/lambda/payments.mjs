import { createHmac, timingSafeEqual } from "node:crypto";

function stripeSigned(payload, header, secret) {
  const parts = {};
  String(header || "")
    .split(",")
    .forEach((piece) => {
      const index = piece.indexOf("=");
      if (index > 0) parts[piece.slice(0, index)] = piece.slice(index + 1);
    });
  if (!parts.t || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(parts.v1);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function stripeSecret() {
  const direct = process.env.STRIPE_SECRET_KEY || "";
  if (direct && direct !== "pending") return direct;
  const name = process.env.STRIPE_SECRET_PARAM || "";
  if (!name) return "";
  const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
  const ssm = new SSMClient({});
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const value = (result.Parameter && result.Parameter.Value) || "";
  if (!value || value === "pending") return "";
  return value;
}

async function stripeForm(path, key, params) {
  const body = new URLSearchParams(params);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await response.json();
  if (!response.ok) {
    return { error: "Payments are not configured." };
  }
  return json;
}

export async function handler(event) {
  const action = event && event.action;
  const key = await stripeSecret();
  if (!key) return { error: "Payments are not configured." };
  const origin = process.env.SITE_ORIGIN || "https://nicelist.co";
  if (action === "checkout") {
    const session = await stripeForm("checkout/sessions", key, {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(event.amountCents),
      "line_items[0][price_data][product_data][name]": event.giftTitle || "Gift contribution",
      "line_items[0][quantity]": "1",
      success_url: `${origin}/list?id=${event.listId}`,
      cancel_url: `${origin}/list?id=${event.listId}`,
      "metadata[listId]": event.listId,
      "metadata[giftId]": event.giftId,
      "metadata[userId]": event.userId,
      "metadata[shopperName]": event.shopperName || "",
      "payment_intent_data[transfer_group]": event.listId,
    });
    if (session.error) return session;
    return { url: session.url };
  }
  if (action === "refund") {
    const refund = await stripeForm("refunds", key, { payment_intent: event.contributionId });
    if (refund.error) return refund;
    return { ok: true };
  }
  if (action === "onboard") {
    const account = await stripeForm("accounts", key, {
      type: "express",
      email: event.email || "",
      "capabilities[transfers][requested]": "true",
    });
    if (account.error || !account.id) return account.error ? account : { error: "Payments are not configured." };
    const link = await stripeForm("account_links", key, {
      account: account.id,
      refresh_url: `${origin}/list`,
      return_url: `${origin}/list`,
      type: "account_onboarding",
    });
    if (link.error) return link;
    await saveAccount(event.userId, account.id);
    return { url: link.url, accountId: account.id };
  }
  if (action === "payout") {
    const accountId = event.accountId || (await payoutAccount(event.userId));
    const amountCents = event.amountCents || (await netForList(event.listId));
    if (!accountId || !amountCents) return { error: "Finish payout setup first." };
    const transfer = await stripeForm("transfers", key, {
      amount: String(amountCents),
      currency: "usd",
      destination: accountId,
      transfer_group: event.listId,
    });
    if (transfer.error) return transfer;
    return { ok: true };
  }
  if (event.body) return webhook(event, key);
  return { error: "Payments are not configured." };
}

async function dynamo() {
  const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } =
    await import("@aws-sdk/lib-dynamodb");
  return {
    doc: DynamoDBDocumentClient.from(new DynamoDBClient({})),
    PutCommand,
    QueryCommand,
    UpdateCommand,
    GetCommand,
  };
}

async function stripeFee(key, paymentIntent) {
  if (!key || !paymentIntent) return 0;
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntent}?expand[]=latest_charge.balance_transaction`,
    { headers: { authorization: `Bearer ${key}` } },
  );
  if (!response.ok) return 0;
  const json = await response.json();
  const fee = json.latest_charge && json.latest_charge.balance_transaction && json.latest_charge.balance_transaction.fee;
  return typeof fee === "number" ? fee : 0;
}

async function saveAccount(userId, accountId) {
  const table = process.env.PROFILES_TABLE || "";
  if (!table || !userId || !accountId) return;
  const { doc, UpdateCommand } = await dynamo();
  await doc.send(
    new UpdateCommand({
      TableName: table,
      Key: { userId },
      UpdateExpression: "SET stripeAccountId = :id",
      ExpressionAttributeValues: { ":id": accountId },
    }),
  );
}

async function payoutAccount(userId) {
  const table = process.env.PROFILES_TABLE || "";
  if (!table || !userId) return "";
  const { doc, GetCommand } = await dynamo();
  const result = await doc.send(new GetCommand({ TableName: table, Key: { userId } }));
  return (result.Item && result.Item.stripeAccountId) || "";
}

async function netForList(listId) {
  const table = process.env.CONTRIBUTIONS_TABLE || "";
  if (!table || !listId) return 0;
  const { doc, QueryCommand } = await dynamo();
  const result = await doc.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "listId = :listId",
      ExpressionAttributeValues: { ":listId": listId },
    }),
  );
  return (result.Items || []).reduce((sum, row) => {
    if (row.status !== "PAID") return sum;
    return sum + (row.amountCents || 0) - (row.feeCents || 0);
  }, 0);
}

async function webhook(event, key) {
  const secretName = process.env.STRIPE_WEBHOOK_PARAM || "";
  if (!secretName) return { statusCode: 400, body: "Payments are not configured." };
  const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
  const ssm = new SSMClient({});
  const secretResult = await ssm.send(
    new GetParameterCommand({ Name: secretName, WithDecryption: true }),
  );
  const secret = (secretResult.Parameter && secretResult.Parameter.Value) || "";
  if (!secret || secret === "pending") {
    return { statusCode: 400, body: "Payments are not configured." };
  }
  const payload = typeof event.body === "string" ? event.body : JSON.stringify(event.body || {});
  const header = (event.headers && (event.headers["stripe-signature"] || event.headers["Stripe-Signature"])) || "";
  if (!stripeSigned(payload, header, secret)) {
    return { statusCode: 400, body: "Payments are not configured." };
  }
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { statusCode: 400, body: "Payments are not configured." };
  }
  const object = (parsed.data && parsed.data.object) || {};
  const meta = object.metadata || {};
  if (parsed.type !== "checkout.session.completed" || !meta.listId || !meta.giftId) {
    return { statusCode: 200, body: "ok" };
  }
  const table = process.env.CONTRIBUTIONS_TABLE || "";
  if (!table) return { statusCode: 200, body: "ok" };
  const amount = object.amount_total || 0;
  const fee = await stripeFee(key, object.payment_intent);
  const { doc, PutCommand, UpdateCommand } = await dynamo();
  const id = object.payment_intent || object.id;
  await doc.send(
    new PutCommand({
      TableName: table,
      Item: {
        listId: meta.listId,
        sk: `CONTRIB#${id}`,
        id,
        giftId: meta.giftId,
        shopperId: meta.userId || "",
        shopperName: meta.shopperName || "Someone",
        amountCents: amount,
        feeCents: fee,
        status: "PAID",
      },
    }),
  );
  if (object.account && meta.userId && process.env.PROFILES_TABLE) {
    await doc.send(
      new UpdateCommand({
        TableName: process.env.PROFILES_TABLE,
        Key: { userId: meta.userId },
        UpdateExpression: "SET stripeAccountId = :id",
        ExpressionAttributeValues: { ":id": object.account },
      }),
    );
  }
  return { statusCode: 200, body: "ok" };
}
