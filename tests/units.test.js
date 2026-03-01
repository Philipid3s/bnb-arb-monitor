import test from "node:test";
import assert from "node:assert/strict";

import { divideToDecimalString, formatUnits, toBaseUnits } from "../units.js";

test("toBaseUnits converts decimal strings using token decimals", () => {
  assert.equal(toBaseUnits("100", 18), 100000000000000000000n);
  assert.equal(toBaseUnits("0.5", 6), 500000n);
  assert.throws(() => toBaseUnits("0.1234567", 6));
});

test("formatUnits prints bigint values as decimal strings", () => {
  assert.equal(formatUnits(1230000n, 6), "1.23");
  assert.equal(formatUnits(2000000n, 6), "2");
});

test("divideToDecimalString keeps precision for bigint division", () => {
  assert.equal(divideToDecimalString(1n, 8n, 6), "0.125");
  assert.equal(divideToDecimalString(10n, 2n, 6), "5");
});

