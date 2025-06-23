import axios from 'axios';

const getOpenOceanPrice = async (tokenInfo) => {
  const baseUrl = 'https://open-api.openocean.finance/v3/bsc/swap_quote';
  const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';

  const tokenAmount = 100; // Montant test, lisible
  const amount = tokenAmount.toString(); // Doit rester un string "100"

  const url = `${baseUrl}?inTokenAddress=${tokenInfo.address}&outTokenAddress=${usdtAddress}&amount=${amount}&gasPrice=5&slippage=1`;

  try {
    const response = await axios.get(url);
    const data = response.data?.data;

    const rawOutAmount = BigInt(data?.outAmount || 0);
    const outDecimals = Number(data?.outToken?.decimals || 18);

    if (rawOutAmount === 0n) {
      console.warn(`[OpenOcean] ❌ ${tokenInfo.symbol}: Pas de outAmount`);
      return { name: 'Unknown', website: null, price: null };
    }

    const outAmount = Number(rawOutAmount) / 10 ** outDecimals;
    const pricePerToken = outAmount / tokenAmount;

    console.log(`[OpenOcean] ✅ ${tokenInfo.symbol} RAW ➜ ${data.outAmount}`);
    console.log(`[OpenOcean] ✅ ${tokenInfo.symbol} ➜ ${pricePerToken.toFixed(6)} USDT`);

    return {
      name: 'OpenOcean',
      website: 'https://openocean.finance',
      price: pricePerToken
    };
  } catch (err) {
    console.error(`[OpenOcean] ❌ ${tokenInfo.symbol}: ${err.message}`);
    return { name: 'Unknown', website: null, price: null };
  }
};

export default getOpenOceanPrice;
