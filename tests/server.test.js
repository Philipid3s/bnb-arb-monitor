import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../server.js";

test("GET /prices returns spread values with injected providers", async () => {
  const app = createApp({
    getCexPricesImpl: async () => [
      { symbol: "CAKE", address: "0xabc", decimals: 18, cexPrice: 10.5 }
    ],
    getDexPriceImpl: async () => ({
      name: "KyberSwap",
      website: "https://kyberswap.com",
      bid: 9.9,
      ask: 10,
      price: 9.95
    })
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/prices`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.length, 1);
    assert.equal(payload[0].token, "CAKE");
    assert.equal(payload[0].dexes[0].direction, "BUY_DEX_SELL_CEX");
    assert.ok(Math.abs(payload[0].dexes[0].spread - 5) < 1e-9);
    assert.ok(Math.abs(payload[0].dexes[0].netSpread - 4.75) < 1e-9);
    assert.equal(payload[0].dexes[0].isOpportunity, true);
    assert.equal(payload[0].dexes[0].suspect, false);
    assert.equal(payload[0].cexStale, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("GET /prices returns no dex entry when both quotes fail", async () => {
  const app = createApp({
    getCexPricesImpl: async () => [
      { symbol: "CAKE", address: "0xabc", decimals: 18, cexPrice: 10 }
    ],
    getDexPriceImpl: async () => ({ name: "KyberSwap", bid: null, ask: null, price: null })
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const payload = await (await fetch(`http://127.0.0.1:${port}/prices`)).json();
    assert.deepEqual(payload[0].dexes, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("GET /prices reuses the cached result within the TTL", async () => {
  let cexCalls = 0;
  const app = createApp({
    getCexPricesImpl: async () => {
      cexCalls += 1;
      return [{ symbol: "CAKE", address: "0xabc", decimals: 18, cexPrice: 10 }];
    },
    getDexPriceImpl: async () => ({ name: "KyberSwap", bid: 9.99, ask: 10.01, price: 10 }),
    pricesCacheTtlMs: 60000
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    await Promise.all([1, 2, 3].map(() => fetch(`http://127.0.0.1:${port}/prices`)));
    await fetch(`http://127.0.0.1:${port}/prices`);
    assert.equal(cexCalls, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
