export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'CAD' | 'AUD';

export interface Money {
  amount: number;
  currency: Currency;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  CAD: 'C$',
  AUD: 'A$',
};

export function centsToMoney(cents: number, currency: Currency = 'USD'): Money {
  return { amount: cents, currency };
}

export function formatMoney(money: Money): string {
  const value = money.amount / 100;
  const symbol = CURRENCY_SYMBOLS[money.currency] ?? '$';
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCents(cents: number, currency: Currency = 'USD'): string {
  return formatMoney(centsToMoney(cents, currency));
}

export function formatCentsCompact(cents: number, currency: Currency = 'USD'): string {
  const value = cents / 100;
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  if (value >= 10000) {
    return `${symbol}${(value / 1000).toFixed(1)}k`;
  }
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function addCents(a: number, b: number): number {
  return a + b;
}

export function subtractCents(a: number, b: number): number {
  return a - b;
}

export function multiplyCents(cents: number, factor: number): number {
  return Math.round(cents * factor);
}

export function applyCommission(cents: number, basisPoints: number): number {
  return Math.round((cents * basisPoints) / 10000);
}

export function netRevenue(
  grossCents: number,
  acquisitionCostCents: number,
  commissionCents: number,
  discountCostCents: number,
  cancellationLossCents: number,
): number {
  return (
    grossCents -
    acquisitionCostCents -
    commissionCents -
    discountCostCents -
    cancellationLossCents
  );
}
