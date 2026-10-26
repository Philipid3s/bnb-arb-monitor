import "dotenv/config";

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
  chain: process.env.DEX_CHAIN ?? "bsc",
  quoteTokenAddress:
    process.env.QUOTE_TOKEN_ADDRESS ?? "0x55d398326f99059fF775485246999027B3197955",
  quoteTokenDecimals: toPositiveInt(process.env.QUOTE_TOKEN_DECIMALS, 18),
  quoteNotionalUsd: toNumber(process.env.QUOTE_NOTIONAL_USD, 1000),
  kyberClientId: process.env.KYBERSWAP_CLIENT_ID ?? "bnb-arb-monitor",
  requestTimeoutMs: toPositiveInt(process.env.REQUEST_TIMEOUT_MS, 5000),
  retryCount: toPositiveInt(process.env.RETRY_COUNT, 2),
  cexCacheTtlMs: toPositiveInt(process.env.CEX_CACHE_TTL_MS, 15000),
  cexMaxStaleMs: toPositiveInt(process.env.CEX_MAX_STALE_MS, 300000),
  coingeckoApiKey: process.env.COINGECKO_API_KEY ?? "",
  pricesCacheTtlMs: toPositiveInt(process.env.PRICES_CACHE_TTL_MS, 10000),
  bscRpcUrl: process.env.BSC_RPC_URL ?? "https://bsc-dataseed.bnbchain.org",
  maxPlausibleSpreadPct: toNumber(process.env.MAX_PLAUSIBLE_SPREAD_PCT, 20),
  tradeCostPct: toNumber(process.env.TRADE_COST_PCT, 0.25),
  minProfitPct: toNumber(process.env.MIN_PROFIT_PCT, 0.1)
};
