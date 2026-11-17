import assert from "node:assert/strict";
import test from "node:test";
import { emptyPreview, parseProductHtml, variantFromUrl } from "./product-page.mjs";
import { isPreviewBot, previewForList, renderPreviewHtml, tokenFromQuery } from "./preview-html.mjs";
import { claimMail, friendMail, stillOpenMail } from "./mail.mjs";
import { handler as payments } from "./payments.mjs";

test("product parser keeps the requested page and reads json-ld without a canonical link", () => {
  const html = `<html><head>
    <link rel="canonical" href="https://shop.example/parent" />
    <meta property="og:image" content="/images/sweater.jpg" />
    <script type="application/ld+json">{"@type":"Product","name":"Navy sweater","offers":{"price":"42.00"}}</script>
  </head></html>`;
  const url = "https://shop.example/item?size=M&color=navy";
  const parsed = parseProductHtml(html, url);
  assert.equal(parsed.title, "Navy sweater");
  assert.equal(parsed.price, 4200);
  assert.equal(parsed.imageUrl, "https://shop.example/images/sweater.jpg");
  assert.equal(parsed.variantNote, variantFromUrl(url));
  assert.equal(parsed.variantNote.includes("size: M"), true);
  assert.equal(JSON.stringify(parsed).includes("parent"), false);
  assert.deepEqual(emptyPreview(), { title: null, price: null, imageUrl: null, variantNote: null });
});

test("public link previews name the list and two gifts, and other tokens stay generic", () => {
  const html = previewForList(
    { name: "Ada's list", visibility: "PUBLIC" },
    [{ title: "Sweater", imageUrl: "https://nicelist.co/gifts/a" }, { title: "Train" }],
  );
  assert.equal(html.includes("Ada&#39;s list") || html.includes("Ada's list"), true);
  assert.equal(html.includes("Sweater"), true);
  assert.equal(html.includes("Train"), true);
  assert.equal(html.includes("og:image"), true);
  const hidden = previewForList({ name: "Secret", visibility: "FRIENDS" }, [{ title: "Secret gift" }]);
  assert.equal(hidden.includes("Secret gift"), false);
  assert.equal(hidden.includes("Nicelist"), true);
  assert.equal(previewForList(null, [{ title: "Nope" }]).includes("Nope"), false);
  assert.equal(isPreviewBot("facebookexternalhit/1.1"), true);
  assert.equal(isPreviewBot("Mozilla/5.0"), false);
  assert.equal(tokenFromQuery("id=1&t=tok%20en"), "tok en");
  assert.equal(renderPreviewHtml({ title: "Nicelist" }).includes("<script"), false);
});

test("mail names the gift and never the buyer", () => {
  const claim = claimMail("Ada's list", "Navy sweater", true, "https://nicelist.co");
  assert.equal(claim.text.includes("Navy sweater"), true);
  assert.equal(claim.text.includes("purchased"), true);
  assert.equal(claim.text.toLowerCase().includes("sam"), false);
  const friend = friendMail("Sam", "https://nicelist.co");
  assert.equal(friend.text.includes("/friends"), true);
  const open = stillOpenMail("Ada's list", 3, "https://nicelist.co", "tok");
  assert.equal(open.text.includes("3 gifts are still open"), true);
  assert.equal(open.text.includes("tok"), true);
});

test("payments fail closed when Stripe is not configured", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_PARAM;
  const result = await payments({ action: "checkout", amountCents: 500 });
  assert.equal(result.error, "Payments are not configured.");
});
