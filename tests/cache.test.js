import test from "node:test";
import assert from "node:assert/strict";

import { createCachedLoader } from "../cache.js";

const clock = (start = 0) => {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
};

test("createCachedLoader serves cached values within the TTL", async () => {
  const c = clock();
  let calls = 0;
  const get = createCachedLoader(async () => ++calls, { ttlMs: 1000, now: c.now });

  assert.equal((await get()).value, 1);
  c.advance(999);
  assert.equal((await get()).value, 1);
  c.advance(1);
  assert.equal((await get()).value, 2);
});

test("createCachedLoader shares one in-flight load between concurrent callers", async () => {
  let calls = 0;
  let release;
  const get = createCachedLoader(
    () => new Promise((resolve) => { calls += 1; release = () => resolve(calls); }),
    { ttlMs: 1000 }
  );

  const pending = [get(), get(), get()];
  release();
  const results = await Promise.all(pending);
  assert.equal(calls, 1);
  assert.deepEqual(results.map((r) => r.value), [1, 1, 1]);
});

test("createCachedLoader falls back to a stale value on error within maxStaleMs", async () => {
  const c = clock();
  let fail = false;
  const get = createCachedLoader(
    async () => {
      if (fail) throw new Error("upstream down");
      return "fresh";
    },
    { ttlMs: 1000, maxStaleMs: 5000, now: c.now }
  );

  await get();
  fail = true;
  c.advance(2000);
  const stale = await get();
  assert.equal(stale.value, "fresh");
  assert.equal(stale.stale, true);
  assert.equal(stale.error.message, "upstream down");

  c.advance(4000);
  await assert.rejects(get(), /upstream down/);
});

test("createCachedLoader does not cache failures", async () => {
  let calls = 0;
  const get = createCachedLoader(
    async () => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return "ok";
    },
    { ttlMs: 1000 }
  );

  await assert.rejects(get(), /boom/);
  assert.equal((await get()).value, "ok");
});
