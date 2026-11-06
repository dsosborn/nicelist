export type ProductPageFields = {
  title: string;
  url: string;
  priceCents: number | null;
  variantNote: string;
};

const VARIANT_KEYS = /(size|color|colour|style|fit|length|width|option|variant)/i;
const PLACEHOLDER_VALUE = /^(select|choose|pick|none|--|please select|all\b)/i;

function cleanText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function parsePriceToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0 || num > 100000) return null;
  return Math.round(num * 100);
}

function readJsonLd(doc: Document): { title?: string; priceCents?: number | null } {
  const scripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]'),
  );
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "null");
      const queue = Array.isArray(parsed)
        ? parsed.slice()
        : parsed && Array.isArray(parsed["@graph"])
          ? parsed["@graph"].slice()
          : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        const type = String(node["@type"] || "");
        if (/product/i.test(type)) {
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          const rawPrice =
            offers?.price ?? offers?.lowPrice ?? node.price ?? null;
          return {
            title: cleanText(node.name),
            priceCents: parsePriceToCents(rawPrice),
          };
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return {};
}

function readPrice(doc: Document, fromLd: number | null | undefined): number | null {
  if (fromLd != null) return fromLd;
  const metaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[itemprop="price"]',
    '[itemprop="price"][content]',
  ];
  for (const selector of metaSelectors) {
    const el = doc.querySelector(selector);
    const content = el?.getAttribute("content");
    const cents = parsePriceToCents(content);
    if (cents != null) return cents;
  }
  const textSelectors = [
    "#corePriceDisplay_desktop_feature_div .a-offscreen",
    "#corePrice_feature_div .a-offscreen",
    '[itemprop="price"]',
    "[data-product-price]",
  ];
  for (const selector of textSelectors) {
    const el = doc.querySelector(selector);
    const cents = parsePriceToCents(
      el?.getAttribute("data-product-price") || el?.textContent,
    );
    if (cents != null) return cents;
  }
  return null;
}

function labelForControl(doc: Document, el: Element): string {
  const aria = cleanText(el.getAttribute("aria-label"));
  if (aria) return aria;
  const id = el.getAttribute("id");
  if (id) {
    const safeId = id.replace(/["\\]/g, "\\$&");
    const label = doc.querySelector(`label[for="${safeId}"]`);
    if (label) return cleanText(label.textContent);
  }
  const wrapping = el.closest("label, fieldset");
  if (wrapping) {
    const legend = wrapping.querySelector("legend");
    if (legend) return cleanText(legend.textContent);
  }
  return cleanText(el.getAttribute("name"));
}

function readVariantNote(doc: Document): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  const push = (label: string, value: string) => {
    const cleanValue = cleanText(value);
    if (!cleanValue || PLACEHOLDER_VALUE.test(cleanValue)) return;
    const cleanLabel = cleanText(label).replace(/:$/, "");
    const entry = cleanLabel ? `${cleanLabel}: ${cleanValue}` : cleanValue;
    const key = entry.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(entry);
  };

  // Amazon variation blocks (#variation_size_name .selection, #variation_color_name .selection, etc.)
  const amazonBlocks = Array.from(doc.querySelectorAll('[id^="variation_"]'));
  for (const block of amazonBlocks) {
    const selection = block.querySelector(".selection");
    if (!selection) continue;
    const rawId = block.getAttribute("id") || "";
    const kind = rawId
      .replace(/^variation_/, "")
      .replace(/_name$/, "")
      .replace(/_/g, " ");
    push(kind, selection.textContent || "");
  }

  // Native <select> controls with an explicit non-placeholder selected option
  const selects = Array.from(doc.querySelectorAll("select"));
  for (const select of selects) {
    const label = labelForControl(doc, select);
    const nameAttr = `${label} ${select.getAttribute("name") || ""} ${select.getAttribute("id") || ""}`;
    if (!VARIANT_KEYS.test(nameAttr)) continue;
    const option = select.selectedOptions?.[0] || select.querySelector("option[selected]");
    if (!option || !option.value) continue;
    push(label || "Option", option.textContent || option.value);
  }

  // Checked radio inputs or aria-checked swatches inside a variant group
  const radios = Array.from(
    doc.querySelectorAll('input[type="radio"]:checked, [role="radio"][aria-checked="true"]'),
  );
  for (const radio of radios) {
    const groupLabel = labelForControl(doc, radio);
    const groupHint = `${groupLabel} ${radio.getAttribute("name") || ""}`;
    if (!VARIANT_KEYS.test(groupHint)) continue;
    const value =
      radio.getAttribute("aria-label") ||
      radio.getAttribute("data-value") ||
      (radio as HTMLInputElement).value ||
      radio.textContent ||
      "";
    push(groupLabel, value);
  }

  return parts.join(", ");
}

export function readProductFromDocument(
  doc: Document,
  locationHref: string,
): ProductPageFields {
  const ld = readJsonLd(doc);
  const ogTitle = cleanText(
    doc.querySelector('meta[property="og:title"]')?.getAttribute("content"),
  );
  const h1 = cleanText(
    doc.querySelector("#productTitle")?.textContent ||
      doc.querySelector("h1")?.textContent,
  );
  const title = ld.title || h1 || ogTitle || cleanText(doc.title);
  return {
    title: title.slice(0, 200),
    // Never substitute the canonical or parent-product URL; keep exact query and hash.
    url: locationHref,
    priceCents: readPrice(doc, ld.priceCents),
    variantNote: readVariantNote(doc),
  };
}
