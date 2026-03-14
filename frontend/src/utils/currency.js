// Approximate XLM conversion rates (in production, fetch from a live price API)
export const CURRENCIES = [
  { code: 'XLM', name: 'Stellar Lumens', flag: '⭐', rate: 1 },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', rate: 0.11 },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', rate: 170 },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', rate: 1.35 },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', rate: 14.5 },
];

export function convertFromXLM(xlmAmount, targetCurrency) {
  const currency = CURRENCIES.find(c => c.code === targetCurrency);
  if (!currency) return xlmAmount;
  return (parseFloat(xlmAmount) * currency.rate).toFixed(2);
}

export function formatAmount(amount, currency = 'XLM') {
  return `${parseFloat(amount).toLocaleString()} ${currency}`;
}

export function truncateAddress(address, chars = 8) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
