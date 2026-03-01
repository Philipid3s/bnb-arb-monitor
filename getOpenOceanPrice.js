import { config } from "./config.js";
import { getJsonWithRetry } from "./http.js";
import { divideToDecimalString } from "./units.js";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

const getOpenOceanPrice = async (tokenInfo) => {
  const baseUrl = `https://open-api.openocean.finance/v3/${config.chain}/swap_quote`;

  if (!DECIMAL_PATTERN.test(String(config.quoteAmount).trim())) {
    console.error(`[OpenOcean] Invalid QUOTE_AMOUNT: "${config.quoteAmount}"`);
    return { name: "Unknown", website: null, price: null };
  }

  const url =
    `${baseUrl}?inTokenAddress=${tokenInfo.address}` +
    `&outTokenAddress=${config.quoteTokenAddress}` +
    `&amount=${encodeURIComponent(config.quoteAmount)}` +
    `&gasPrice=${config.gasPrice}` +
    `&slippage=${config.slippage}`;

  try {
    const payload = await getJsonWithRetry(url, {
      retries: config.retryCount,
      timeoutMs: config.requestTimeoutMs
    });
    const data = payload?.data;
    const rawInAmount = BigInt(data?.inAmount ?? 0);
    const rawOutAmount = BigInt(data?.outAmount ?? 0);
    const inDecimals = Number(data?.inToken?.decimals ?? tokenInfo.decimals ?? 18);
    const outDecimals = Number(data?.outToken?.decimals ?? 18);

    if (rawInAmount === 0n || rawOutAmount === 0n) {
      console.warn(`[OpenOcean] ${tokenInfo.symbol}: empty in/out amount`);
      return { name: "Unknown", website: null, price: null };
    }

    const numerator = rawOutAmount * 10n ** BigInt(inDecimals);
    const denominator = rawInAmount * 10n ** BigInt(outDecimals);
    const pricePerToken = Number(divideToDecimalString(numerator, denominator, 12));

    return {
      name: "OpenOcean",
      website: "https://openocean.finance",
      price: Number.isFinite(pricePerToken) ? pricePerToken : null
    };
  } catch (err) {
    console.error(`[OpenOcean] ${tokenInfo.symbol}: ${err.message}`);
    return { name: "Unknown", website: null, price: null };
  }
};

export default getOpenOceanPrice;
