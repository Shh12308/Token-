import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { stakeETH, getStakedBalance } from '../services/staking';
import { getBalance } from '../services/rpc'; // Your existing balance service

export default function StakeScreen({ route }) {
  const { privateKey, address } = route.params; // Passed from Dashboard
  
  const [ethBalance, setEthBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [amount, setAmount] = useState('');

  // Load balances when screen opens
  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    const eth = await getBalance(address);
    const staked = await getStakedBalance(address);
    setEthBalance(eth);
    setStakedBalance(staked);
  };

  const handleStake = async () => {
    if (parseFloat(amount) > parseFloat(ethBalance)) {
      Alert.alert("Error", "Not enough ETH balance");
      return;
    }

    Alert.alert("Confirm Stake", `Stake ${amount} ETH?`, [
      { text: "Cancel" },
      { 
        text: "Stake", 
        onPress: async () => {
          const result = await stakeETH(privateKey, amount);
          if (result.success) {
            Alert.alert("Success!", "Your ETH is now staked.");
            loadBalances(); // Refresh UI
          } else {
            Alert.alert("Failed", result.error);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stake Ethereum</Text>
      
      {/* Balances Section */}
      <View style={styles.card}>
        <Text>Available ETH: {ethBalance}</Text>
        <Text>Staked ETH (stETH): {stakedBalance}</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Amount to stake"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <Button title="Stake Now" onPress={handleStake} />
      </View>
      
      <Text style={styles.info}>
        You will receive stETH tokens representing your stake.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 20 },
  inputArea: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  info: { fontSize: 12, color: 'gray', textAlign: 'center' }
});
