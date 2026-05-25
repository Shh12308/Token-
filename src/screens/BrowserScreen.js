import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View } from 'react-native';

export default function BrowserScreen({ route }) {
  const webviewRef = useRef();
  const { walletAddress } = route.params;

  // Injected JavaScript to simulate MetaMask
  const injectedJs = `
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: "${walletAddress}",
      networkVersion: "1",
      request: (args) => {
        // Handle requests like 'eth_requestAccounts' or 'eth_sendTransaction'
        if (args.method === 'eth_requestAccounts') {
          return Promise.resolve(["${walletAddress}"]);
        }
        // You would need to bridge actual transaction signing here via postMessage
        window.ReactNativeWebView.postMessage(JSON.stringify(args));
        return Promise.resolve(null);
      }
    };
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'https://app.uniswap.org' }} // Default DApp
        injectedJavaScript={injectedJs}
        onMessage={(event) => {
          // Handle communication from the website back to your wallet logic
          console.log("DApp Request:", event.nativeEvent.data);
        }}
      />
    </View>
  );
}
