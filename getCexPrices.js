import axios from 'axios';

import tokens from './tokens.js';

const getCexPrices = async (tokenInfo) => {
  try {
    const ids = {
      CAKE: 'pancakeswap-token',
      WBNB: 'wbnb',
      ETH: 'ethereum',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      DOT: 'polkadot',
      XRP: 'ripple'
    };

    const coingeckoIds = Object.values(ids).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`;

    const response = await axios.get(url);
    const prices = response.data;

    return tokens.map(token => ({
      ...token,
      cexPrice: prices[ids[token.symbol]]?.usd || null
    }));
  } catch (err) {
    console.error('[CoinGecko] ❌ Erreur:', err.message);
    return tokens.map(t => ({ ...t, cexPrice: null }));
  }
};

export default getCexPrices;
