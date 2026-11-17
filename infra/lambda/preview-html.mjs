const GENERIC_TITLE = "Nicelist";
const GENERIC_DESCRIPTION = "A Christmas list, shared without spoiling the surprise.";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPreviewBot(userAgent) {
  return /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|TelegramBot|Discordbot|LinkedInBot|Applebot|Pinterest|embedly|quora link preview|vkShare|W3C_Validator/i.test(
    userAgent || "",
  );
}

export function tokenFromQuery(querystring) {
  const raw = String(querystring || "");
  const match = raw.match(/(?:^|&)t=([^&]+)/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export function renderPreviewHtml({ title, description, image }) {
  const safeTitle = escapeHtml(title || GENERIC_TITLE);
  const safeDescription = escapeHtml(description || GENERIC_DESCRIPTION);
  const imageTag = image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${safeTitle}</title><meta property="og:title" content="${safeTitle}" /><meta property="og:description" content="${safeDescription}" />${imageTag}<meta name="robots" content="noindex" /></head><body></body></html>`;
}

export function previewForList(list, gifts, imageBase) {
  if (!list || list.visibility !== "PUBLIC") {
    return renderPreviewHtml({ title: GENERIC_TITLE, description: GENERIC_DESCRIPTION });
  }
  const titles = (gifts || [])
    .map((gift) => (gift.title || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const image = (gifts || []).map((gift) => gift.imageUrl).find(Boolean) || "";
  const absolute = image && imageBase && image.indexOf("http") !== 0 ? `${imageBase}${image}` : image;
  return renderPreviewHtml({
    title: list.name || GENERIC_TITLE,
    description: titles.length ? titles.join(" · ") : GENERIC_DESCRIPTION,
    image: absolute || "",
  });
}
