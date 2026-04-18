export function formatSignedMoney(n: number): string {
  if (n >= 0) return `+$${n.toFixed(0)}`;
  return `-$${Math.abs(n).toFixed(0)}`;
}
