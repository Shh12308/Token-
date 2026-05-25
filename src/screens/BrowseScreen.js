import React, { useRef, useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/FontAwesome'; // Ensure you link this if using older RN versions

export default function BrowserScreen({ route }) {
  // Get wallet details passed from Dashboard
  const { walletAddress } = route.params; 
  
  const webviewRef = useRef(null);
  const [url, setUrl] = useState('https://app.uniswap.org'); // Default homepage
  const [inputText, setInputText] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 1. Web3 Injection Logic (The "Magic" Script) ---
  // This script runs inside the website to make it think a wallet is installed.
  const injectedJavaScript = `
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: "${walletAddress}",
      networkVersion: "1", // 1 = Ethereum Mainnet
      
      // Handle requests from websites (e.g., "Connect Wallet")
      request: (args) => {
        if (args.method === 'eth_requestAccounts') {
          // Return the user's address immediately
          return Promise.resolve(["${walletAddress}"]);
        }
        if (args.method === 'eth_accounts') {
          return Promise.resolve(["${walletAddress}"]);
        }
        
        // IMPORTANT: For 'eth_sendTransaction', you would need to:
        // 1. Use window.ReactNativeWebView.postMessage to send data to your app.
        // 2. Show a "Confirm Transaction" modal in your native UI.
        // 3. Sign it with the user's private key.
        // 4. Send the hash back to the webview.
        
        return Promise.resolve(null);
      },
      
      // Event listeners (basic simulation)
      on: (event, callback) => {
        console.log('Web3 Event:', event);
      },
      removeListener: (event, callback) => {}
    };
    
    // This triggers websites to detect the wallet automatically
    window.dispatchEvent(new Event('ethereum#initialized'));
    true;
  `;

  // --- 2. Navigation Handlers ---
  const handleNavigationStateChange = (navState) => {
    setUrl(navState.url);
    setInputText(navState.url);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  const handleGo = () => {
    Keyboard.dismiss();
    let searchUrl = inputText;

    // Simple check: if it's not a URL, search Google
    if (!inputText.includes('.')) {
      searchUrl = `https://www.google.com/search?q=${inputText}`;
    } else if (!inputText.startsWith('http')) {
      searchUrl = `https://${inputText}`;
    }

    webviewRef.current.injectJavaScript(`window.location.href = "${searchUrl}";`);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- Top Bar (URL Input) --- */}
      <View style={styles.barContainer}>
        <TouchableOpacity 
          style={styles.navButton} 
          disabled={!canGoBack} 
          onPress={() => webviewRef.current.goBack()}
        >
          <Icon name="chevron-left" size={20} color={canGoBack ? "#000" : "#ccc"} />
        </TouchableOpacity>

        <TextInput
          style={styles.urlInput}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleGo}
          returnKeyType="go"
          placeholder="Search or enter URL"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.navButton} 
          disabled={!canGoForward} 
          onPress={() => webviewRef.current.goForward()}
        >
          <Icon name="chevron-right" size={20} color={canGoForward ? "#000" : "#ccc"} />
        </TouchableOpacity>
      </View>

      {/* --- The Browser --- */}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        injectedJavaScript={injectedJavaScript}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        // Security: Block known phishing sites here if you have a list
        onShouldStartLoadWithRequest={(request) => {
           if (request.url.includes('scam-site.com')) {
             Alert.alert("Blocked", "This site is flagged as a scam.");
             return false;
           }
           return true;
        }}
      />

      {/* --- Loading Spinner --- */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  urlInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButton: {
    padding: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60, // Below the bar
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
