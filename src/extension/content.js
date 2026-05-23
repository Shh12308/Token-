window.addEventListener('message', async (event) => {
  if (event.data.target !== 'CRYPTOBEAN_EXTENSION') return;

  const response = await chrome.runtime.sendMessage({
    type: 'REQUEST',
    payload: event.data
  });

  window.postMessage(
    {
      target: 'CRYPTOBEAN_INJECT',
      id: event.data.id,
      ...response
    },
    '*'
  );
});
