import { BatchGetItemCommand, DynamoDBClient, QueryCommand, UpdateCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { claimMail, claimMailUserIds, friendMail, pokeMail, stillOpenMail } from "./mail.mjs";

const dynamo = new DynamoDBClient({});
const ses = new SESClient({});

function origin() {
  return process.env.SITE_ORIGIN || "https://nicelist.co";
}

function fromAddress() {
  return process.env.MAIL_FROM || "";
}

async function send(to, message) {
  const source = fromAddress();
  if (!source || !to) return;
  await ses.send(
    new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: message.subject },
        Body: { Text: { Data: message.text } },
      },
    }),
  );
}

async function emailsFor(userIds) {
  const table = process.env.PROFILES_TABLE;
  const ids = (userIds || []).filter(Boolean);
  if (!table || !ids.length) return [];
  const out = [];
  for (let i = 0; i < ids.length; i += 25) {
    const keys = ids.slice(i, i + 25).map((id) => ({ userId: { S: id } }));
    const result = await dynamo.send(
      new BatchGetItemCommand({ RequestItems: { [table]: { Keys: keys } } }),
    );
    const rows = (result.Responses && result.Responses[table]) || [];
    rows.forEach((row) => {
      if (row.email && row.email.S && row.userId && row.userId.S) {
        out.push({ userId: row.userId.S, email: row.email.S });
      }
    });
  }
  return out;
}

async function friendIds(userId) {
  const table = process.env.RELATIONSHIPS_TABLE;
  if (!table || !userId) return [];
  const result = await dynamo.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "userId = :userId AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: { "#sk": "sk" },
      ExpressionAttributeValues: { ":userId": { S: userId }, ":sk": { S: "FRIEND#" } },
    }),
  );
  return (result.Items || []).map((row) => (row.otherId && row.otherId.S) || "").filter(Boolean);
}

async function deliverClaim(event) {
  const list = {
    recipientId: event.recipientId,
    ownerId: (event.managerIds || [])[0],
    managerIds: event.managerIds || [],
    visibility: event.visibility,
  };
  const friends = [];
  for (const managerId of event.managerIds || []) {
    const ids = await friendIds(managerId);
    ids.forEach((id) => friends.push(id));
  }
  const targets = claimMailUserIds(list, friends, event.actorId).filter((id) => id !== event.recipientId);
  const people = await emailsFor(targets);
  const message = claimMail(event.listName, event.giftTitle, !!event.purchased, origin());
  for (const person of people) {
    if (person.userId === event.recipientId) continue;
    await send(person.email, message);
  }
}

async function deliverPoke(event) {
  const people = await emailsFor(event.managerIds || []);
  const message = pokeMail(event.senderName, event.listName, event.band, origin());
  for (const person of people) await send(person.email, message);
}

async function openCount(listId) {
  const table = process.env.CLAIMS_TABLE;
  if (!table) return 0;
  const result = await dynamo.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "listId = :listId",
      ExpressionAttributeValues: { ":listId": { S: listId } },
    }),
  );
  return (result.Items || []).filter((row) => row.status && row.status.S === "OPEN").length;
}

async function digest() {
  const table = process.env.MAIL_TABLE;
  if (!table) return { ok: true };
  const day = new Date().toISOString().slice(0, 10);
  const due = await dynamo.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "dueDate = :day",
      ExpressionAttributeValues: { ":day": { S: day } },
    }),
  );
  for (const row of due.Items || []) {
    if (row.sent && row.sent.BOOL) continue;
    const listId = row.listId.S;
    const count = await openCount(listId);
    if (!count) continue;
    const managerIds = ((row.managerIds && row.managerIds.L) || []).map((item) => item.S).filter(Boolean);
    const recipientId = row.recipientId && row.recipientId.S;
    const friends = [];
    for (const managerId of managerIds) {
      (await friendIds(managerId)).forEach((id) => friends.push(id));
    }
    const targets = claimMailUserIds(
      {
        recipientId,
        managerIds,
        visibility: row.visibility && row.visibility.S,
      },
      friends,
      null,
    );
    const people = await emailsFor(targets);
    const message = stillOpenMail(
      row.listName && row.listName.S,
      count,
      origin(),
      row.shareToken && row.shareToken.S,
    );
    for (const person of people) {
      if (person.userId === recipientId) continue;
      await send(person.email, message);
    }
    await dynamo.send(
      new UpdateCommand({
        TableName: table,
        Key: { dueDate: { S: day }, listId: { S: listId } },
        UpdateExpression: "SET sent = :sent",
        ExpressionAttributeValues: { ":sent": { BOOL: true } },
      }),
    );
  }
  return { ok: true };
}

export async function handler(event) {
  if (!event || event.action === "digest") return digest();
  if (!fromAddress()) return { ok: false };
  try {
    if (event.action === "friend") {
      await send(event.toEmail, friendMail(event.fromName, origin()));
    } else if (event.action === "poke") {
      await deliverPoke(event);
    } else if (event.action === "claim") {
      await deliverClaim(event);
    }
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
