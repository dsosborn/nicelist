import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { emptyPreview, parseProductHtml } from "./product-page.mjs";

const s3 = new S3Client({});

async function storeImage(imageUrl) {
  const bucket = process.env.IMAGE_BUCKET || "";
  const base = process.env.IMAGE_BASE_URL || "";
  if (!bucket || !base || !imageUrl) return null;
  let response;
  try {
    response = await fetch(imageUrl, { redirect: "manual" });
  } catch {
    return null;
  }
  if (response.status >= 300 && response.status < 400) return null;
  if (!response.ok) return null;
  const type = response.headers.get("content-type") || "image/jpeg";
  if (type.indexOf("image/") !== 0) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 4000000) return null;
  const id = crypto.randomUUID();
  const key = `gifts/${id}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: type,
    }),
  );
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function handler(event) {
  if (event && event.action === "copy") {
    try {
      const stored = await storeImage(String(event.url || ""));
      return { imageUrl: stored };
    } catch {
      return { imageUrl: null };
    }
  }
  const url = String((event && event.url) || "");
  if (!url || url.length > 2048) return emptyPreview();
  let response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "Nicelist/1.0" },
    });
  } catch {
    return emptyPreview();
  }
  if (response.status >= 300 && response.status < 400) return emptyPreview();
  if (!response.ok) return emptyPreview();
  const html = (await response.text()).slice(0, 500000);
  const parsed = parseProductHtml(html, url);
  if (parsed.imageUrl) {
    try {
      const stored = await storeImage(parsed.imageUrl);
      parsed.imageUrl = stored;
    } catch {
      parsed.imageUrl = null;
    }
  }
  return parsed;
}
