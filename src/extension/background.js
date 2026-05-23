let connectedSites = {};

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type !== 'REQUEST') return;

  const { method, params, id } = msg.payload;
  const origin = sender.origin;

  try {
    switch (method) {
      case 'eth_requestAccounts':
        return handleConnect(origin);

      case 'eth_accounts':
        return getAccounts(origin);

      case 'eth_sendTransaction':
        return handleSendTx(origin, params);

      case 'personal_sign':
        return handleSign(origin, params);

      default:
        throw new Error('Unsupported method');
    }
  } catch (err) {
    return { error: err.message };
  }
});
