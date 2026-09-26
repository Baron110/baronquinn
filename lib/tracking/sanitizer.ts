// Every term that must never reach a customer, no matter what a courier's
// raw API response contains. Carried over from TRACK-ONLINE's sanitizer,
// which went through several rounds of real-world tuning against live
// AliExpress/Shein-sourced tracking data.
const BLOCKED_TERMS = [
  // Marketplaces
  "aliexpress",
  "amazon",
  "shein",
  "temu",
  "wish",
  "ebay",
  "shopee",
  "lazada",
  "jd.com",
  "taobao",
  "tmall",
  "pinduoduo",
  "dhgate",
  // Couriers / carriers
  "cainiao",
  "yanwen",
  "yun express",
  "4px",
  "epacket",
  "cnexps",
  "cj packet",
  "cj dropshipping",
  "cj logistics",
  "dhl",
  "fedex",
  "ups",
  "usps",
  "royal mail",
  "hermes",
  "evri",
  "dpd",
  "gls",
  "tnt",
  "aramex",
  "sfexpress",
  "sf express",
  "china post",
  "hongkong post",
  "singapore post",
  "correos",
  "poste italiane",
  "la poste",
  "bpost",
  "postnl",
  "post nl",
  "deutsche post",
  "japan post",
  "india post",
  "australia post",
  "canada post",
  "new zealand post",
  // Supplier / fulfillment references
  "seller",
  "merchant",
  "vendor",
  "supplier",
  "warehouse",
  "dropship",
  "fulfillment center"
];

function hasBlocked(raw: string): boolean {
  const lower = raw.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

function stripBlocked(raw: string): string {
  let cleaned = raw;
  for (const term of BLOCKED_TERMS) {
    // Case-insensitive removal, along with a trailing/leading connector
    // word or punctuation so it doesn't leave behind an awkward "by ,".
    const pattern = new RegExp(`(\\bby\\s+)?${term}(\\s*,)?`, "gi");
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.replace(/\s{2,}/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").trim();
}

// Event descriptions pass through mostly as-is (real detail like town names
// and facility names is what makes this look professional) — we only strip
// terms that would reveal where the package actually came from.
export function sanitizeDescription(raw: string): string {
  if (!raw) return "Package status updated";
  const cleaned = hasBlocked(raw) ? stripBlocked(raw) : raw.trim();
  if (!cleaned) return "Package status updated";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function sanitizeLocation(raw: string): string {
  if (!raw) return "";
  if (!hasBlocked(raw)) return raw.trim();
  const parts = raw.split(",").map((p) => p.trim());
  const clean = parts.filter((p) => !BLOCKED_TERMS.some((t) => p.toLowerCase().includes(t)));
  return clean.join(", ").trim();
}
