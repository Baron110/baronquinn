export function formatNaira(amount: number) {
  // Defensive against undefined/null/NaN — a record missing this field
  // (an old test account from before it existed, say) shouldn't crash the
  // whole page it's rendered on.
  const safe = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  return "\u20A6" + safe.toLocaleString("en-NG");
}