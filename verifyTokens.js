import axios from "axios";

import { config } from "./config.js";
import tokens from "./tokens.js";

const DECIMALS_SELECTOR = "0x313ce567"; // decimals()

const readDecimals = async (address, { rpcUrl, post }) => {
  const { data } = await post(
    rpcUrl,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: address, data: DECIMALS_SELECTOR }, "latest"]
    },
    { timeout: config.requestTimeoutMs }
  );
  if (data?.error || !data?.result || data.result === "0x") {
    throw new Error(data?.error?.message ?? "empty eth_call result");
  }
  return Number(BigInt(data.result));
};

// Compares tokens.js decimals with each contract's decimals() and corrects mismatches in place,
// since wrong decimals silently produce prices that are off by orders of magnitude.
export const verifyTokenDecimals = async ({
  tokenList = tokens,
  rpcUrl = config.bscRpcUrl,
  post = axios.post
} = {}) => {
  await Promise.all(
    tokenList.map(async (token) => {
      try {
        const onChain = await readDecimals(token.address, { rpcUrl, post });
        if (onChain !== token.decimals) {
          console.warn(
            `[tokens] ${token.symbol}: decimals ${token.decimals} in tokens.js, ${onChain} on-chain; using on-chain value`
          );
          token.decimals = onChain;
        }
      } catch (err) {
        console.warn(`[tokens] ${token.symbol}: could not verify decimals (${err.message})`);
      }
    })
  );
};
