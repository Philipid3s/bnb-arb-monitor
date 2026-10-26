import { createCachedLoader } from "./cache.js";
import { config } from "./config.js";
import { getJsonWithRetry } from "./http.js";
import tokens from "./tokens.js";

const fetchPrices = () => {
  const ids = tokens.map((token) => token.coingeckoId).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  return getJsonWithRetry(url, {
    retries: config.retryCount,
    timeoutMs: config.requestTimeoutMs,
    headers: config.coingeckoApiKey ? { "x-cg-demo-api-key": config.coingeckoApiKey } : {}
  });
};

const loadPrices = createCachedLoader(fetchPrices, {
  ttlMs: config.cexCacheTtlMs,
  maxStaleMs: config.cexMaxStaleMs
});

const mapTokensWithPrices = (prices, stale) =>
  tokens.map((token) => ({
    ...token,
    cexPrice: prices?.[token.coingeckoId]?.usd ?? null,
    cexStale: stale
  }));

const getCexPrices = async () => {
  try {
    const { value, at, stale, error } = await loadPrices();
    if (stale) {
      const ageSec = Math.round((Date.now() - at) / 1000);
      console.warn(`[CoinGecko] Error: ${error.message}; serving prices from ${ageSec}s ago`);
    }
    return mapTokensWithPrices(value, stale);
  } catch (err) {
    console.error(`[CoinGecko] Error: ${err.message}`);
    return mapTokensWithPrices(null, false);
  }
};

export default getCexPrices;
