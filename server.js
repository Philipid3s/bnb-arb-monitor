import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { createCachedLoader } from "./cache.js";
import { config } from "./config.js";
import getCexPrices from "./getCexPrices.js";
import getDexPrice from "./getDexPrice.js";
import { evaluateSpread } from "./spread.js";
import { verifyTokenDecimals } from "./verifyTokens.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = ({
  getCexPricesImpl = getCexPrices,
  getDexPriceImpl = getDexPrice,
  pricesCacheTtlMs = config.pricesCacheTtlMs
} = {}) => {
  const buildPrices = async () => {
    const enrichedTokens = await getCexPricesImpl();
    return Promise.all(
      enrichedTokens.map(async (token) => {
        const dexData = await getDexPriceImpl(token);
        const dexes =
          dexData?.bid != null || dexData?.ask != null
            ? [{ ...dexData, ...evaluateSpread(token.cexPrice, dexData) }]
            : [];

        return {
          token: token.symbol,
          address: token.address,
          cexPrice: token.cexPrice,
          cexStale: Boolean(token.cexStale),
          dexes
        };
      })
    );
  };

  // Shared across clients so open dashboards don't multiply upstream requests.
  const loadPrices = createCachedLoader(buildPrices, { ttlMs: pricesCacheTtlMs });

  const app = express();
  app.use(cors());
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/prices", async (req, res) => {
    try {
      const { value } = await loadPrices();
      res.json(value);
    } catch (err) {
      console.error(`[SERVER] Error: ${err.message}`);
      res.status(500).json({ error: "Server error" });
    }
  });

  return app;
};

export const startServer = async () => {
  await verifyTokenDecimals();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
};

const isDirectRun =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  startServer();
}
