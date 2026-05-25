import React, { useState, useEffect } from 'react';
import { View, Button, Text, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
// Services
import { createWallet, importWallet } from './services/crypto';
import { getBalance, sendTransaction } from './services/rpc'; // Now uses your Backend Proxy
import { getBuyUrl } from './services/fiat';
import { getSwapQuote } from './services/swap';
import { registerUser, createPriceAlert } from './services/alerts'; // NEW: Backend Alert Service
// Notifications
import OneSignal from 'react-native-onesignal';

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [sendTo, setSendTo] = useState('');
  const [amount, setAmount] = useState('');
  const [playerId, setPlayerId] = useState(null); // Stores OneSignal Device ID
  const [alertPrice, setAlertPrice] = useState(''); // For Price Alert Input

  // --- 1. Initialize OneSignal (Run once on app load) ---
  useEffect(() => {
    // Initialize OneSignal
    OneSignal.setAppId("YOUR_ONESIGNAL_APP_ID"); // <--- REPLACE THIS

    // Get the Device ID (Player ID) needed to send notifications
    OneSignal.getDeviceState().then(deviceState => {
      if (deviceState && deviceState.userId) {
        console.log("OneSignal Player ID:", deviceState.userId);
        setPlayerId(deviceState.userId);
      }
    });

    // Prompt for notifications (Required for iOS)
    OneSignal.promptForPushNotificationsWithUserResponse(response => {
      console.log("Notification permission:", response);
    });
  }, []);

  // --- 2. Register User with Backend when Wallet is Created ---
  useEffect(() => {
    if (wallet && playerId) {
      // Tell the backend: "This Wallet Address belongs to this Device ID"
      registerUser(wallet.address, playerId);
    }
  }, [wallet, playerId]);

  const handleCreate = () => {
    const newWallet = createWallet();
    setWallet(newWallet);
    Alert.alert("Wallet Created", "Save your seed:\n\n" + newWallet.mnemonic);
  };

  const refreshBalance = async () => {
    if(wallet) {
      try {
        // This now goes through your secure backend proxy
        const bal = await getBalance(wallet.address);
        setBalance(bal);
      } catch (e) {
        Alert.alert("Network Error", "Could not connect to backend.");
      }
    }
  };

  const handleSend = async () => {
    try {
      const hash = await sendTransaction(wallet.privateKey, sendTo, amount);
      Alert.alert("Sent!", "Tx Hash: " + hash);
      refreshBalance(); // Update balance after sending
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // --- 3. Handle Price Alert Creation ---
  const handleSetAlert = async () => {
    if (!alertPrice) return;
    
    const result = await createPriceAlert(wallet.address, 'ETH', alertPrice);
    
    if (result.success) {
      Alert.alert("Alert Set", `You will be notified when ETH hits $${alertPrice}`);
      setAlertPrice(''); // Clear input
    } else {
      Alert.alert("Error", "Could not create alert. Check backend logs.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{flex: 1, backgroundColor: '#fff'}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        {!wallet ? (
          <View style={styles.centerBox}>
            <Text style={styles.title}>MySuperWallet</Text>
            <Button title="Create Wallet" onPress={handleCreate} />
          </View>
        ) : (
          <>
            {/* --- Dashboard Header --- */}
            <Text style={styles.label}>Your Address:</Text>
            <Text selectable style={styles.address}>{wallet.address}</Text>
            
            <Text style={styles.label}>Balance:</Text>
            <Text style={styles.balance}>{parseFloat(balance).toFixed(4)} ETH</Text>
            
            <Button title="Refresh Balance" onPress={refreshBalance} />

            {/* --- Send Section --- */}
            <View style={styles.section}>
              <Text style={styles.header}>Send ETH</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Recipient Address" 
                onChangeText={setSendTo} 
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input} 
                placeholder="Amount (ETH)" 
                onChangeText={setAmount} 
                keyboardType="decimal-pad"
              />
              <Button title="Send Transaction" onPress={handleSend} />
            </View>

            {/* --- Price Alert Section (NEW) --- */}
            <View style={styles.section}>
              <Text style={styles.header}>Set Price Alert</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Alert me when ETH hits ($)" 
                onChangeText={setAlertPrice} 
                keyboardType="decimal-pad"
                value={alertPrice}
              />
              <Button title="Create Alert" onPress={handleSetAlert} color="#34C759" />
            </View>

            {/* --- Actions --- */}
            <View style={styles.section}>
              <Button title="Buy Crypto (Fiat Ramp)" onPress={() => {
                  const url = getBuyUrl(wallet.address);
                  // Implement WebBrowser.openBrowserAsync(url) here
                  Alert.alert("Open Browser", "Open this URL: " + url);
              }} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 500,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  address: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  }
});
