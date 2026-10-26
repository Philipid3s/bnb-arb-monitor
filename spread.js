import { config } from "./config.js";

const pctGain = (sellPrice, buyPrice) => ((sellPrice - buyPrice) / buyPrice) * 100;

// Evaluates both directions and keeps the better one:
// - BUY_DEX_SELL_CEX: buy on the DEX at its ask, sell at the CEX reference price
// - BUY_CEX_SELL_DEX: buy at the CEX reference price, sell on the DEX at its bid
export const evaluateSpread = (
  cexPrice,
  { bid, ask } = {},
  { tradeCostPct, minProfitPct, maxPlausibleSpreadPct = Infinity } = config
) => {
  const candidates = [];
  if (cexPrice != null && ask != null) {
    candidates.push({ direction: "BUY_DEX_SELL_CEX", spread: pctGain(cexPrice, ask) });
  }
  if (cexPrice != null && bid != null) {
    candidates.push({ direction: "BUY_CEX_SELL_DEX", spread: pctGain(bid, cexPrice) });
  }

  if (!candidates.length) {
    return { direction: null, spread: null, netSpread: null, isOpportunity: false, suspect: false };
  }

  const best = candidates.reduce((a, b) => (b.spread > a.spread ? b : a));
  // A gap this large on liquid tokens almost always means bad data (wrong decimals, stale price).
  const suspect = Math.abs(best.spread) > maxPlausibleSpreadPct;
  return {
    ...best,
    netSpread: best.spread - tradeCostPct,
    isOpportunity: !suspect && best.spread > tradeCostPct + minProfitPct,
    suspect
  };
};
