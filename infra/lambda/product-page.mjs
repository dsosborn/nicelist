const VARIANT_KEYS = /size|color|colour|style|fit|length|width|option|variant/i;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function priceToCents(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0 || num > 100000) return null;
  return Math.round(num * 100);
}

function metaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const found = html.match(pattern);
    if (found) return clean(found[1]);
  }
  return "";
}

function readJsonLd(html) {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const body = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(body);
      const queue = Array.isArray(parsed) ? parsed.slice() : parsed && Array.isArray(parsed["@graph"]) ? parsed["@graph"].slice() : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        if (/product/i.test(String(node["@type"] || ""))) {
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          const image = Array.isArray(node.image) ? node.image[0] : node.image;
          const imageUrl = typeof image === "string" ? image : image && image.url;
          return {
            title: clean(node.name),
            price: priceToCents(offers && (offers.price || offers.lowPrice)),
            imageUrl: clean(imageUrl),
          };
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return {};
}

export function variantFromUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    const parts = [];
    url.searchParams.forEach((value, key) => {
      if (!VARIANT_KEYS.test(key)) return;
      const cleanValue = clean(value);
      if (!cleanValue || /^(select|choose|default|none)$/i.test(cleanValue)) return;
      parts.push(`${key}: ${cleanValue}`);
    });
    return parts.join(", ");
  } catch {
    return "";
  }
}

export function emptyPreview() {
  return { title: null, price: null, imageUrl: null, variantNote: null };
}

export function parseProductHtml(html, pageUrl) {
  const source = String(html || "").slice(0, 500000);
  const ld = readJsonLd(source);
  const title = ld.title || metaContent(source, "og:title") || "";
  const price =
    ld.price ||
    priceToCents(metaContent(source, "product:price:amount")) ||
    priceToCents(metaContent(source, "og:price:amount"));
  const image = ld.imageUrl || metaContent(source, "og:image");
  let imageUrl = image || "";
  if (imageUrl && pageUrl) {
    try {
      imageUrl = new URL(imageUrl, pageUrl).toString();
    } catch {
      imageUrl = "";
    }
  }
  const variantNote = variantFromUrl(pageUrl);
  return {
    title: title ? title.slice(0, 200) : null,
    price: price || null,
    imageUrl: imageUrl || null,
    variantNote: variantNote || null,
  };
}
