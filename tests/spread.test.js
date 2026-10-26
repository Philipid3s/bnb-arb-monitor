import test from "node:test";
import assert from "node:assert/strict";

import { evaluateSpread } from "../spread.js";

const costs = { tradeCostPct: 0.25, minProfitPct: 0.1 };

test("evaluateSpread flags buy-DEX/sell-CEX when DEX ask is below CEX", () => {
  const result = evaluateSpread(10, { bid: 7.9, ask: 8 }, costs);
  assert.equal(result.direction, "BUY_DEX_SELL_CEX");
  assert.equal(result.spread, 25);
  assert.equal(result.netSpread, 24.75);
  assert.equal(result.isOpportunity, true);
});

test("evaluateSpread flags buy-CEX/sell-DEX when DEX bid is above CEX", () => {
  const result = evaluateSpread(10, { bid: 11, ask: 11.1 }, costs);
  assert.equal(result.direction, "BUY_CEX_SELL_DEX");
  assert.ok(Math.abs(result.spread - 10) < 1e-9);
  assert.equal(result.isOpportunity, true);
});

test("evaluateSpread reports the less negative direction when there is no edge", () => {
  const result = evaluateSpread(10, { bid: 9.99, ask: 10.05 }, costs);
  assert.equal(result.direction, "BUY_CEX_SELL_DEX");
  assert.ok(result.spread < 0);
  assert.equal(result.isOpportunity, false);
});

test("evaluateSpread uses whichever side is available", () => {
  assert.equal(evaluateSpread(10, { bid: null, ask: 8 }, costs).direction, "BUY_DEX_SELL_CEX");
  assert.equal(evaluateSpread(10, { bid: 11, ask: null }, costs).direction, "BUY_CEX_SELL_DEX");
});

test("evaluateSpread returns nulls without a CEX price", () => {
  assert.deepEqual(evaluateSpread(null, { bid: 9, ask: 10 }, costs), {
    direction: null,
    spread: null,
    netSpread: null,
    isOpportunity: false,
    suspect: false
  });
});

test("evaluateSpread marks implausible spreads as suspect, not opportunities", () => {
  const result = evaluateSpread(1.28, { bid: 0.0000001, ask: 0.0000001 }, { ...costs, maxPlausibleSpreadPct: 20 });
  assert.equal(result.suspect, true);
  assert.equal(result.isOpportunity, false);

  const normal = evaluateSpread(10, { bid: 7.9, ask: 8 }, { ...costs, maxPlausibleSpreadPct: 30 });
  assert.equal(normal.suspect, false);
  assert.equal(normal.isOpportunity, true);
});
