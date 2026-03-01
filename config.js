const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  port: toPositiveInt(process.env.PORT, 4000),
  chain: process.env.OPENOCEAN_CHAIN ?? "bsc",
  quoteTokenAddress:
    process.env.QUOTE_TOKEN_ADDRESS ?? "0x55d398326f99059fF775485246999027B3197955",
  quoteAmount: process.env.QUOTE_AMOUNT ?? "100",
  slippage: toNumber(process.env.SLIPPAGE, 1),
  gasPrice: toNumber(process.env.GAS_PRICE, 5),
  requestTimeoutMs: toPositiveInt(process.env.REQUEST_TIMEOUT_MS, 5000),
  retryCount: toPositiveInt(process.env.RETRY_COUNT, 2),
  cexCacheTtlMs: toPositiveInt(process.env.CEX_CACHE_TTL_MS, 15000),
  tradeCostPct: toNumber(process.env.TRADE_COST_PCT, 0.25),
  minProfitPct: toNumber(process.env.MIN_PROFIT_PCT, 0.1)
};
