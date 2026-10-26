// Wraps an async loader with a TTL cache. Concurrent callers share one in-flight load.
// With maxStaleMs, a failed load falls back to the last value while it is younger than that;
// the result is then flagged `stale` and carries the `error`.
export const createCachedLoader = (load, { ttlMs, maxStaleMs = 0, now = Date.now } = {}) => {
  let entry = null;
  let inFlight = null;

  return () => {
    if (entry && now() - entry.at < ttlMs) {
      return Promise.resolve({ value: entry.value, at: entry.at, stale: false });
    }

    if (!inFlight) {
      inFlight = (async () => {
        try {
          const value = await load();
          entry = { value, at: now() };
          return { value, at: entry.at, stale: false };
        } catch (error) {
          if (entry && now() - entry.at <= maxStaleMs) {
            return { value: entry.value, at: entry.at, stale: true, error };
          }
          throw error;
        } finally {
          inFlight = null;
        }
      })();
    }

    return inFlight;
  };
};
