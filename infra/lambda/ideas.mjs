import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

function parseIdeas(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) return [];
  return parsed.slice(0, 4).map((idea) => ({
    title: String(idea.title || "").slice(0, 200),
    price: Number(idea.price) || 0,
    reason: String(idea.reason || "").slice(0, 280),
    kind: ["PRODUCT", "CUSTOM", "EXPERIENCE", "MEMBERSHIP"].includes(idea.kind) ? idea.kind : "CUSTOM",
    timingPhrase: idea.timingPhrase || null,
    membershipPhrase: idea.membershipPhrase || null,
  }));
}

export const handler = async (event) => {
  const band = event.band || "MID";
  const gifts = Array.isArray(event.gifts) ? event.gifts : [];
  const lines = gifts.map((gift) => {
    const price = gift.price == null ? "no price" : `$${(gift.price / 100).toFixed(0)}`;
    return `- ${gift.title || "untitled"} (${price}) ${gift.notes || ""}`.trim();
  });
  const prompt = [
    "Suggest three Christmas gift ideas as JSON only.",
    `Price band: ${band}. UNDER_25 is under $25, MID is $25 to $75, OVER_75 is over $75.`,
    "Each idea needs title, price in cents inside the band, reason, and kind.",
    "kind is CUSTOM, EXPERIENCE, or MEMBERSHIP.",
    "EXPERIENCE includes timingPhrase: ANYTIME, THIS_SEASON, NEXT_SEASON, or PICK_LATER.",
    "MEMBERSHIP includes membershipPhrase: ANNUAL, SEASON_PACKAGE, or DIGITAL.",
    "Do not include a store link. Do not mention who is asking.",
    event.displayName ? `The gift is for ${event.displayName}.` : "",
    event.standingNote ? `A private note from the shopper: ${event.standingNote}` : "",
    lines.length ? `Gifts already on the list:\n${lines.join("\n")}` : "The list has no gifts yet.",
    'Return a JSON array of objects: {"title","price","reason","kind","timingPhrase","membershipPhrase"}.',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: process.env.IDEA_MODEL_ID || "amazon.nova-micro-v1:0",
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 700, temperature: 0.4 },
      }),
    );
    const text = response.output?.message?.content?.[0]?.text || "";
    return { ideas: parseIdeas(text) };
  } catch {
    return { ideas: [] };
  }
};
