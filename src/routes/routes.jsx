import React, { useState } from 'react';
import { View, Button, Text, TextInput, Alert } from 'react-native';
import { createWallet, importWallet } from './services/crypto';
import { getBalance, sendTransaction } from './services/rpc';
import { getBuyUrl } from './services/fiat';
import { getSwapQuote } from './services/swap';

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [sendTo, setSendTo] = useState('');
  const [amount, setAmount] = useState('');

  const handleCreate = () => {
    const newWallet = createWallet();
    setWallet(newWallet);
    Alert.alert("Wallet Created", "Save your seed: " + newWallet.mnemonic);
  };

  const refreshBalance = async () => {
    if(wallet) {
      const bal = await getBalance(wallet.address);
      setBalance(bal);
    }
  };

  const handleSend = async () => {
    try {
      const hash = await sendTransaction(wallet.privateKey, sendTo, amount);
      Alert.alert("Sent!", "Tx Hash: " + hash);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      {!wallet ? (
        <Button title="Create Wallet" onPress={handleCreate} />
      ) : (
        <>
          <Text>Address: {wallet.address}</Text>
          <Text>Balance: {balance} ETH</Text>
          <Button title="Refresh Balance" onPress={refreshBalance} />
          
          <View style={{ marginTop: 20 }}>
            <TextInput placeholder="Send To (Address)" onChangeText={setSendTo} />
            <TextInput placeholder="Amount (ETH)" onChangeText={setAmount} />
            <Button title="Send ETH" onPress={handleSend} />
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title="Buy Crypto" onPress={() => {
                const url = getBuyUrl(wallet.address);
                // Open URL in WebBrowser/WebView here
            }} />
          </View>
        </>
      )}
    </View>
  );
}
