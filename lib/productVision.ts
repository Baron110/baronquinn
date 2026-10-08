// Reads a product photo (or a screenshot of a product listing) with a vision
// model and returns the fields the admin would otherwise type by hand.
// Price is never guessed. For screenshots, a price that is actually printed
// in the image is read out and returned; otherwise the admin sets it.

export type VisionMode = "photo" | "screenshot";

export type VisionResult = {
  name: string;
  description: string;
  // slug of the best-fit category, or "" if nothing fits
  categorySlug: string;
  // customised/personalised item (photo frame, engraved, etc.)
  looksCustom: boolean;
  // Screenshots only: the selling price printed in the image (digits only), or null.
  detectedPrice: number | null;
  // Currency of that price: "NGN", "USD", "GBP", "EUR", other ISO code, or "".
  priceCurrency: string;
  // Only for screenshots: where the product photo sits, as 0–1 fractions of
  // the full image. null if the whole image already is the photo.
  box: { x: number; y: number; w: number; h: number } | null;
};

function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export async function analyzeProductImage(
  dataUrl: string,
  mode: VisionMode,
  categories: { slug: string; label: string }[]
): Promise<VisionResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const catList = categories.map((c) => `${c.slug} (${c.label})`).join(", ") || "none";

  const common = `You help a Nigerian gift shop (Baronquinn) list products. Reply with ONE JSON object only.
Fields:
- "name": short product name, Title Case, no emojis, no brand hype, max 60 chars.
- "description": ONE or TWO plain sentences describing what is visible (colour, type, what's included). Do not invent materials, sizes, brands or claims you cannot see or read. Style example: "A silver bracelet with a heart charm."
- "categorySlug": the best fit from this list, exactly as written before the bracket, or "" if none fit: ${catList}
- "looksCustom": true only if it is a personalised/engraved/photo-printed item that the buyer would customise.`;

  const screenshotExtra = `
This image is a SCREENSHOT of a product listing (it contains app/website UI, text, maybe a price).
- "name": use the product title text that is written in the screenshot (cleaned up). If no title is shown, describe the item.
- "detectedPrice": the current selling price printed in the screenshot as a plain number (e.g. "₦45,000" -> 45000, "45k" -> 45000, "N 12,500.00" -> 12500). If a crossed-out old price and a current price both show, use the current one. null if no price is visible. Never guess a price that is not written.
- "priceCurrency": "NGN" for ₦, N or naira; "USD" for $; "GBP" for £; "EUR" for €; another ISO code if clearly shown; "" if there is no price or no currency symbol.
- Ignore ratings, reviews, buttons, status bar and seller details.
- "box": {"x":0-1,"y":0-1,"w":0-1,"h":0-1} = the tightest rectangle around ONLY the main product photo (no text, no buttons, no status bar, no thumbnails strip), as fractions of the full image width/height measured from the top-left. If several photos are shown, use the largest main one.`;

  const photoExtra = `
This image is a plain product photo. Name it from what you see. Set "box" to null.`;

  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: common + (mode === "screenshot" ? screenshotExtra : photoExtra) },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyse this image and return the JSON." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
          ]
        }
      ]
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `OpenAI request failed (${res.status})`);

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("The AI returned nothing for this image");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The AI reply could not be read");
  }

  const slugs = new Set(categories.map((c) => c.slug));
  const categorySlug = typeof parsed.categorySlug === "string" && slugs.has(parsed.categorySlug) ? parsed.categorySlug : "";

  let box: VisionResult["box"] = null;
  if (mode === "screenshot" && parsed.box && typeof parsed.box === "object") {
    const x = clamp01(parsed.box.x);
    const y = clamp01(parsed.box.y);
    const w = Math.min(clamp01(parsed.box.w), 1 - x);
    const h = Math.min(clamp01(parsed.box.h), 1 - y);
    // Ignore boxes that are tiny or basically the whole image.
    if (w > 0.1 && h > 0.1 && !(w > 0.97 && h > 0.97)) box = { x, y, w, h };
  }

  let detectedPrice: number | null = null;
  if (mode === "screenshot") {
    const n = Number(String(parsed.detectedPrice ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) detectedPrice = Math.round(n);
  }
  const priceCurrency =
    detectedPrice !== null && typeof parsed.priceCurrency === "string" ? parsed.priceCurrency.trim().toUpperCase().slice(0, 4) : "";

  return {
    detectedPrice,
    priceCurrency,
    name: String(parsed.name ?? "").trim().slice(0, 80),
    description: String(parsed.description ?? "").trim().slice(0, 400),
    categorySlug,
    looksCustom: !!parsed.looksCustom,
    box
  };
}