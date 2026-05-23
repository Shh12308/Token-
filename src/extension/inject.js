(() => {
  if (window.ethereum) return;

  const listeners = {};

  const ethereum = {
    isCryptoBean: true,

    request: ({ method, params }) => {
      return new Promise((resolve, reject) => {
        const id = Date.now();

        window.postMessage(
          {
            target: 'CRYPTOBEAN_EXTENSION',
            type: 'REQUEST',
            id,
            method,
            params
          },
          '*'
        );

        listeners[id] = { resolve, reject };
      });
    },

    on: (event, handler) => {
      window.addEventListener(event, handler);
    }
  };

  window.addEventListener('message', (event) => {
    if (event.data.target !== 'CRYPTOBEAN_INJECT') return;

    const { id, result, error } = event.data;

    if (!listeners[id]) return;

    if (error) listeners[id].reject(error);
    else listeners[id].resolve(result);

    delete listeners[id];
  });

  window.ethereum = ethereum;
})();
