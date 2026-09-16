export function formatNaira(amount: number) {
  return "\u20A6" + amount.toLocaleString("en-NG");
}
