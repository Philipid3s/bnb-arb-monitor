import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { config } from "./config.js";
import getCexPrices from "./getCexPrices.js";
import getOpenOceanPrice from "./getOpenOceanPrice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (
  { getCexPricesImpl = getCexPrices, getOpenOceanPriceImpl = getOpenOceanPrice } = {}
) => {
  const app = express();
  app.use(cors());
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/prices", async (req, res) => {
    try {
      const enrichedTokens = await getCexPricesImpl();
      const results = await Promise.all(
        enrichedTokens.map(async (token) => {
          const dexData = await getOpenOceanPriceImpl(token);
          const dexes = dexData?.price
            ? [
                (() => {
                  const spread =
                    token.cexPrice != null
                      ? ((token.cexPrice - dexData.price) / dexData.price) * 100
                      : null;
                  const threshold = config.tradeCostPct + config.minProfitPct;
                  const netSpread = spread != null ? spread - config.tradeCostPct : null;
                  const isOpportunity = spread != null ? spread > threshold : false;

                  return {
                    ...dexData,
                    spread,
                    netSpread,
                    isOpportunity
                  };
                })()
              ]
            : [];

          return {
            token: token.symbol,
            address: token.address,
            cexPrice: token.cexPrice,
            dexes
          };
        })
      );

      res.json(results);
    } catch (err) {
      console.error(`[SERVER] Error: ${err.message}`);
      res.status(500).json({ error: "Server error" });
    }
  });

  return app;
};

export const startServer = () => {
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
