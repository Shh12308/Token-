import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { ethers } from 'ethers';
import { saveWallet } from '../services/auth';

export default function SetupScreen({ onWalletCreated }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleCreate = () => {
    if (password.length < 6) return Alert.alert("Error", "Password too short");
    if (password !== confirm) return Alert.alert("Error", "Passwords do not match");

    // 1. Generate Wallet
    const wallet = ethers.Wallet.createRandom();
    
    // 2. Encrypt and Save
    saveWallet(wallet.privateKey, password, wallet.mnemonic.phrase);

    // 3. Show Seed Phrase (CRITICAL STEP)
    Alert.alert(
      "Back up your Secret Phrase",
      `Write this down: \n\n${wallet.mnemonic.phrase}`,
      [{ text: "I've saved it", onPress: () => onWalletCreated(wallet.privateKey) }]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Create a Wallet</Text>
      
      <TextInput 
        placeholder="Create Password" 
        secureTextEntry 
        onChangeText={setPassword} 
        style={{ borderBottomWidth: 1, marginVertical: 20 }} 
      />
      <TextInput 
        placeholder="Confirm Password" 
        secureTextEntry 
        onChangeText={setConfirm} 
        style={{ borderBottomWidth: 1, marginBottom: 20 }} 
      />

      <Button title="Create Wallet" onPress={handleCreate} />
    </View>
  );
}
