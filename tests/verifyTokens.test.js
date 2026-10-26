import test from "node:test";
import assert from "node:assert/strict";

import { verifyTokenDecimals } from "../verifyTokens.js";

const fakeRpc = (decimalsByAddress) => async (_url, body) => {
  const value = decimalsByAddress[body.params[0].to];
  if (value instanceof Error) throw value;
  return { data: { result: `0x${value.toString(16).padStart(64, "0")}` } };
};

test("verifyTokenDecimals corrects mismatched decimals and keeps correct ones", async () => {
  const tokenList = [
    { symbol: "OK", address: "0xa", decimals: 18 },
    { symbol: "BAD", address: "0xb", decimals: 6 }
  ];

  await verifyTokenDecimals({ tokenList, rpcUrl: "rpc", post: fakeRpc({ "0xa": 18, "0xb": 18 }) });

  assert.equal(tokenList[0].decimals, 18);
  assert.equal(tokenList[1].decimals, 18);
});

test("verifyTokenDecimals keeps configured decimals when the RPC call fails", async () => {
  const tokenList = [{ symbol: "X", address: "0xc", decimals: 8 }];

  await verifyTokenDecimals({ tokenList, rpcUrl: "rpc", post: fakeRpc({ "0xc": new Error("timeout") }) });

  assert.equal(tokenList[0].decimals, 8);
});
