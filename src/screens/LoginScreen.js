import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { unlockWallet } from '../services/auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [password, setPassword] = useState('');

  const handleUnlock = () => {
    const key = unlockWallet(password);
    
    if (key) {
      onLoginSuccess(key); // Correct password
    } else {
      Alert.alert("Error", "Wrong password, try again.");
    }
  };

  return (
    <View style={{ padding: 20, justifyContent: 'center', flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Welcome Back</Text>
      <Text style={{ textAlign: 'center', marginBottom: 30 }}>Unlock your wallet</Text>
      
      <TextInput 
        placeholder="Enter Password" 
        secureTextEntry 
        onChangeText={setPassword} 
        style={{ borderBottomWidth: 1, marginBottom: 20 }} 
      />

      <Button title="Unlock" onPress={handleUnlock} />
    </View>
  );
}
