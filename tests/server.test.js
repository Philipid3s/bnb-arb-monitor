import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../server.js";

test("GET /prices returns spread values with injected providers", async () => {
  const app = createApp({
    getCexPricesImpl: async () => [
      { symbol: "CAKE", address: "0xabc", decimals: 18, cexPrice: 10 }
    ],
    getOpenOceanPriceImpl: async () => ({
      name: "OpenOcean",
      website: "https://openocean.finance",
      price: 8
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
    assert.equal(payload[0].dexes[0].spread, 25);
    assert.equal(payload[0].dexes[0].netSpread, 24.75);
    assert.equal(payload[0].dexes[0].isOpportunity, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
