import axios from 'axios';

const ONE_INCH_API = "https://api.1inch.dev/swap/v6.0/1"; // 1 is Ethereum Mainnet Chain ID

export const getSwapQuote = async (fromToken, toToken, amount, walletAddress) => {
  const response = await axios.get(`${ONE_INCH_API}/quote`, {
    params: {
      src: fromToken, // Token address e.g., "0xeeee..." for ETH
      dst: toToken,   // Token address e.g., "0xdac17..." for USDT
      amount: amount,
      from: walletAddress,
    },
    headers: {
      'Authorization': 'Bearer YOUR_1INCH_API_KEY'
    }
  });
  return response.data;
};

// Note: To complete the swap, you would take the 'tx' object from the quote 
// and send it using the sendTransaction function from rpc.js
