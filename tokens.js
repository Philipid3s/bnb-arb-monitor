// Token watchlist (BNB Chain). `decimals` must match the contract; it is checked on-chain at startup.
const tokens = [
  { symbol: 'CAKE', address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', decimals: 18, coingeckoId: 'pancakeswap-token' },
  { symbol: 'WBNB', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', decimals: 18, coingeckoId: 'wbnb' },
  { symbol: 'ETH', address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', decimals: 18, coingeckoId: 'ethereum' },
  { symbol: 'ADA', address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', decimals: 18, coingeckoId: 'cardano' },
  { symbol: 'DOGE', address: '0xba2ae424d960c26247dd6c32edc70b295c744c43', decimals: 8, coingeckoId: 'dogecoin' },
  { symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', decimals: 18, coingeckoId: 'polkadot' },
  { symbol: 'XRP', address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', decimals: 18, coingeckoId: 'ripple' }
];
export default tokens;
