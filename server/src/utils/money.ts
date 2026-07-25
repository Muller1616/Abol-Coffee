export function toMoneyNumber(value: { toString(): string } | number | string): number {
  return Number(value);
}

export function formatMoney(value: { toString(): string } | number | string): string {
  return toMoneyNumber(value).toFixed(2);
}
