import { config } from "./config.js";
import { getJsonWithRetry } from "./http.js";
import tokens from "./tokens.js";

const ids = {
  CAKE: "pancakeswap-token",
  WBNB: "wbnb",
  ETH: "ethereum",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  XRP: "ripple"
};

let cache = { at: 0, payload: null };

const mapTokensWithPrices = (prices) =>
  tokens.map((token) => ({
    ...token,
    cexPrice: prices?.[ids[token.symbol]]?.usd ?? null
  }));

const getCexPrices = async () => {
  const now = Date.now();
  if (cache.payload && now - cache.at < config.cexCacheTtlMs) {
    return cache.payload;
  }

  try {
    const coingeckoIds = Object.values(ids).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`;
    const prices = await getJsonWithRetry(url, {
      retries: config.retryCount,
      timeoutMs: config.requestTimeoutMs
    });

    const payload = mapTokensWithPrices(prices);
    cache = { at: now, payload };
    return payload;
  } catch (err) {
    console.error(`[CoinGecko] Error: ${err.message}`);
    return mapTokensWithPrices(null);
  }
};

export default getCexPrices;

