import { config } from "./config.js";
import { getJsonWithRetry } from "./http.js";
import { divideToDecimalString, toBaseUnits } from "./units.js";

const PROVIDER = { name: "KyberSwap", website: "https://kyberswap.com" };

const getAmountOut = async (tokenIn, tokenOut, amountIn) => {
  const url =
    `https://aggregator-api.kyberswap.com/${config.chain}/api/v1/routes` +
    `?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`;
  const payload = await getJsonWithRetry(url, {
    retries: config.retryCount,
    timeoutMs: config.requestTimeoutMs,
    headers: { "x-client-id": config.kyberClientId }
  });

  const amountOut = payload?.data?.routeSummary?.amountOut;
  if (!amountOut) {
    throw new Error(payload?.message ?? "no route returned");
  }
  return BigInt(amountOut);
};

// Quote-token price per token, from raw base-unit amounts.
const toPrice = (quoteUnits, tokenUnits, tokenDecimals) =>
  Number(
    divideToDecimalString(
      quoteUnits * 10n ** BigInt(tokenDecimals),
      tokenUnits * 10n ** BigInt(config.quoteTokenDecimals),
      12
    )
  );

// Sell side: swap QUOTE_NOTIONAL_USD worth of token into the quote token (DEX bid).
const getBid = async (token) => {
  if (!(token.cexPrice > 0)) {
    return null;
  }
  const tokenAmount = (config.quoteNotionalUsd / token.cexPrice).toFixed(
    Math.min(token.decimals, 12)
  );
  const amountIn = toBaseUnits(tokenAmount, token.decimals);
  const amountOut = await getAmountOut(token.address, config.quoteTokenAddress, amountIn);
  return toPrice(amountOut, amountIn, token.decimals);
};

// Buy side: swap QUOTE_NOTIONAL_USD of the quote token into token (DEX ask).
const getAsk = async (token) => {
  const amountIn = toBaseUnits(String(config.quoteNotionalUsd), config.quoteTokenDecimals);
  const amountOut = await getAmountOut(config.quoteTokenAddress, token.address, amountIn);
  return toPrice(amountIn, amountOut, token.decimals);
};

const describeError = (err) => {
  const status = err.response?.status;
  const message = err.response?.data?.message ?? err.message;
  return status ? `HTTP ${status}: ${message}` : message;
};

const getDexPrice = async (token) => {
  const [bid, ask] = await Promise.all(
    [
      ["sell", getBid],
      ["buy", getAsk]
    ].map(([side, fn]) =>
      fn(token).catch((err) => {
        console.error(`[KyberSwap] ${token.symbol} ${side}: ${describeError(err)}`);
        return null;
      })
    )
  );

  const finite = (value) => (Number.isFinite(value) && value > 0 ? value : null);
  const safeBid = finite(bid);
  const safeAsk = finite(ask);
  const price =
    safeBid != null && safeAsk != null ? (safeBid + safeAsk) / 2 : safeBid ?? safeAsk;

  return {
    ...PROVIDER,
    notionalUsd: config.quoteNotionalUsd,
    bid: safeBid,
    ask: safeAsk,
    price
  };
};

export default getDexPrice;
