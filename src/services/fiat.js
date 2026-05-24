// This generates a URL to open in a browser/webview inside your app
export const getBuyUrl = (walletAddress) => {
  // Replace with your MoonPay/Sardine/Transak API Key
  const API_KEY = "YOUR_MOONPAY_API_KEY";
  
  const url = `https://buy.moonpay.com?apiKey=${API_KEY}&walletAddress=${walletAddress}`;
  return url;
};
