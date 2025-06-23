import express from 'express';

import getOpenOceanPrice from './getOpenOceanPrice.js';
import getCexPrices from './getCexPrices.js';

const app = express();
const PORT = 4000;

// 🧠 Endpoint principal
app.get('/prices', async (req, res) => {
  try {
    const enrichedTokens = await getCexPrices();

    const results = await Promise.all(enrichedTokens.map(async (token) => {
      const dexData = await getOpenOceanPrice(token);

      console.log(`[DEBUG] ${token.symbol} ➜`, dexData);

      const dexes = dexData?.price
        ? [{
            ...dexData,
            spread: token.cexPrice
              ? ((token.cexPrice - dexData.price) / dexData.price) * 100
              : null
          }]
        : [];

      return {
        token: token.symbol,
        address: token.address,
        cexPrice: token.cexPrice,
        dexes
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('[SERVER] ❌ Erreur:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🚀 Lancement
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
