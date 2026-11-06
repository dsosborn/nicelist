import { describe, expect, it } from "vitest";
import { readProductFromDocument } from "../src/content/readProduct";

describe("readProductFromDocument", () => {
  it("keeps the exact URL (ignoring canonical), reads JSON-LD price, and puts selected Amazon variants in the note", () => {
    const doc = new DOMParser().parseFromString(
      `<!doctype html>
      <html>
        <head>
          <link rel="canonical" href="https://www.amazon.com/dp/B00PARENT" />
          <script type="application/ld+json">
            {"@type":"Product","name":" Merino Crew Sweater ","offers":{"price":"68.50"}}
          </script>
        </head>
        <body>
          <div id="variation_size_name"><span class="selection">Medium</span></div>
          <div id="variation_color_name"><span class="selection">Navy</span></div>
        </body>
      </html>`,
      "text/html",
    );
    const exactUrl =
      "https://www.amazon.com/dp/B00VARIANT?th=1&psc=1&size=M#details";
    const result = readProductFromDocument(doc, exactUrl);
    expect(result.title).toBe("Merino Crew Sweater");
    expect(result.url).toBe(exactUrl);
    expect(result.priceCents).toBe(6850);
    expect(result.variantNote).toBe("size: Medium, color: Navy");
  });

  it("reads a local shop's select and checked radio variants", () => {
    const doc = new DOMParser().parseFromString(
      `<!doctype html>
      <html>
        <head>
          <meta property="og:title" content="Oak Street Flannel" />
          <meta property="product:price:amount" content="54.00" />
        </head>
        <body>
          <label for="size-select">Size</label>
          <select id="size-select" name="size">
            <option value="">Choose a size</option>
            <option value="10" selected>10</option>
          </select>
          <fieldset>
            <legend>Color</legend>
            <input type="radio" name="color" value="Pine" checked />
          </fieldset>
        </body>
      </html>`,
      "text/html",
    );
    const url = "https://oakshop.example/items/flannel?variant=99";
    const result = readProductFromDocument(doc, url);
    expect(result.title).toBe("Oak Street Flannel");
    expect(result.url).toBe(url);
    expect(result.priceCents).toBe(5400);
    expect(result.variantNote).toBe("Size: 10, Color: Pine");
  });

  it("leaves the note blank when no variant is selected or only a placeholder option is active", () => {
    const doc = new DOMParser().parseFromString(
      `<!doctype html>
      <html>
        <head><title>Simple Mug</title></head>
        <body>
          <h1>Simple Mug</h1>
          <span itemprop="price">$18.00</span>
          <label for="size-select">Size</label>
          <select id="size-select" name="size">
            <option value="" selected>Select a size</option>
            <option value="S">Small</option>
          </select>
        </body>
      </html>`,
      "text/html",
    );
    const url = "https://ceramics.example/mug";
    const result = readProductFromDocument(doc, url);
    expect(result.title).toBe("Simple Mug");
    expect(result.url).toBe(url);
    expect(result.priceCents).toBe(1800);
    expect(result.variantNote).toBe("");
  });
});
