
import 'react-native-get-random-values';
import PortfolioDashboard from './src/screens/PortfolioDashboard';
import MarketsScreen from './src/screens/MarketsScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORKS } from './chains/networks';


import {
  AppState,
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ethers } from 'ethers';
import {
  deriveEvmWallet,
  deriveBitcoinWallet,
  deriveSolanaWallet,
} from './src/services/multiChainWallet';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';

import BuyCryptoScreen from './src/screens/BuyCryptoScreen';
import LoginScreen from './src/screens/LoginScreen';
import SetupScreen from './src/screens/SetupScreen';
import StakeScreenn from './src/screens/StakeScreen';
import BrowserScreen from './src/screens/BrowserScreen';
import NFTsScreen from './src/screens/NFTsScreen';
import WalletManagerScreen from './screens/WalletManagerScreen';

import { hasWallet, saveWallet } from './src/services/auth';
import { importWallet } from './src/services/crypto';
import { getBalance, sendTransaction } from './src/services/rpc';
import { createPriceAlert } from './src/services/alerts';
import SecurityCenterScreen from './src/screens/SecurityCenterScreen';
import AccountAuthScreen from './src/screens/AccountAuthScreen';
import { getCurrentCustomer, logout } from './src/services/authApi';

const WALLET_CHAINS = [
  ...NETWORKS.map((network) => ({
    ...network,
    type: 'evm',
  })),
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'bitcoin',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana',
  },
];

import { colors } from './src/theme/globalStyles';

const C = {
  bg: colors.background,
  surface: colors.surface,
  card: colors.card,
  cardAlt: colors.cardAlt,
  border: colors.border,
  gold: colors.gold,
  goldLight: colors.goldLight,
  warning: colors.warning,
  blue: colors.blue,
  blueLight: colors.blueLight,
  blueMuted: colors.blueMuted,
  white: colors.white,
  text: colors.textPrimary,
  muted: colors.muted,
  subdued: colors.subdued,
  green: colors.success,
  red: colors.danger,
};

const TABS = [
  { label: 'Home', icon: 'home' },
  { label: 'Send', icon: 'arrow-up-right' },
  { label: 'Receive', icon: 'arrow-down-left' },
  { label: 'Buy', icon: 'plus-circle' },
  { label: 'More', icon: 'grid' },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [authScreen, setAuthScreen] = useState('setup');
  const [wallet, setWallet] = useState(null);
  const [masterPhrase, setMasterPhrase] = useState(null);
  const [tab, setTab] = useState('Home');
  const [balance, setBalance] = useState('0');
  // NETWORK_SWITCHER_UPGRADE
  const [networkId, setNetworkId] = useState('ethereum');

  const [recipient, setRecipient] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [amount, setAmount] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const activityResetRef = useRef(null);

  const selectedNetwork =
    WALLET_CHAINS.find((network) => network.id === networkId) || WALLET_CHAINS[0];

  const activeEvmWallet = (() => {
    if (!wallet || selectedNetwork.type !== 'evm') return null;

    if (!masterPhrase) {
      return selectedNetwork.id === 'ethereum' ? wallet : null;
    }

    const derived = deriveEvmWallet(masterPhrase, selectedNetwork.id);
    return new ethers.Wallet(derived.privateKey);
  })();

  const activeAddress = (() => {
    if (!wallet) return '';

    if (selectedNetwork.type === 'bitcoin') {
      return masterPhrase ? deriveBitcoinWallet(masterPhrase).address : '';
    }

    if (selectedNetwork.type === 'solana') {
      return masterPhrase ? deriveSolanaWallet(masterPhrase).address : '';
    }

    return activeEvmWallet?.address || '';
  })();

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem('cryptobean.selectedNetwork')
      .then((savedId) => {
        if (active && WALLET_CHAINS.some((network) => network.id === savedId)) {
          setNetworkId(savedId);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const chooseNetwork = () => {
    const buttons = WALLET_CHAINS.map((network) => ({
      text: network.id === networkId
        ? `✓ ${network.name}`
        : network.name,
      onPress: async () => {
        if (network.id !== 'ethereum' && !masterPhrase) {
          Alert.alert(
            'Password sign-in required',
            'Please sign in with your wallet password to unlock the separate account for this network.'
          );
          return;
        }

        setNetworkId(network.id);
        setBalance('0');
        try {
          await AsyncStorage.setItem(
            'cryptobean.selectedNetwork',
            network.id
          );
        } catch {
          Alert.alert(
            'Network preference',
            'The network changed, but could not be saved for next time.'
          );
        }
      },
    }));

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Choose network', 'Select the blockchain for this wallet.', buttons);
  };


  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const currentCustomer = await getCurrentCustomer();

        if (!active) return;

        setCustomer(currentCustomer);

        if (currentCustomer) {
          const exists = await hasWallet();
          if (!active) return;
          setAuthScreen(exists ? 'login' : 'setup');
        }
      } catch (error) {
        if (active) {
          setAccountError(
            error?.message || 'Unable to connect to the account service.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Lock when the app backgrounds or after 30 seconds without touch activity.
  useEffect(() => {
    if (!wallet) {
      activityResetRef.current = null;
      return undefined;
    }

    let timer;
    let locked = false;

    const lock = () => {
      if (locked) return;
      locked = true;
      clearTimeout(timer);
      activityResetRef.current = null;
      setWallet(null);
      setMasterPhrase(null);
      setAuthScreen('login');
      setTab('Home');
    };

    const resetTimer = () => {
      if (locked) return;
      clearTimeout(timer);
      timer = setTimeout(lock, 30_000);
    };

    activityResetRef.current = resetTimer;
    resetTimer();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        lock();
      } else {
        resetTimer();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
      activityResetRef.current = null;
    };
  }, [wallet]);

  const openWallet = (privateKey, recoveryPhrase = null) => {
    try {
      const existingWallet = new ethers.Wallet(privateKey);
      let nextWallet = existingWallet;

      if (recoveryPhrase) {
        const derivedWallet = deriveEvmWallet(recoveryPhrase);

        if (
          derivedWallet.address.toLowerCase() !==
          existingWallet.address.toLowerCase()
        ) {
          Alert.alert(
            'Wallet verification failed',
            'The recovery phrase does not match the saved wallet. The wallet has not been switched.'
          );
          return;
        }

        nextWallet = new ethers.Wallet(derivedWallet.privateKey);
      }

      setWallet(nextWallet);
      setMasterPhrase(
        typeof recoveryPhrase === 'string' && recoveryPhrase.trim()
          ? recoveryPhrase.trim()
          : null
      );
      setBalance('0');
      setTab('Home');
    } catch {
      Alert.alert('Wallet error', 'The wallet could not be opened.');
    }
  };

  const refreshBalance = async () => {
    if (!wallet || busy) return;

    if (selectedNetwork.type !== 'evm') {
      Alert.alert(
        'Balance unavailable',
        `Live ${selectedNetwork.symbol} balances are not implemented yet.`
      );
      return;
    }

    if (!activeEvmWallet) {
      Alert.alert(
        'Wallet locked',
        'Sign in with your wallet password to unlock this network account.'
      );
      return;
    }

    setBusy(true);
    try {
      const result = await getBalance(activeEvmWallet.address, networkId);
      setBalance(String(result));
    } catch {
      Alert.alert(
        'Network error',
        'Could not retrieve the balance. Check the network or backend configuration.'
      );
    } finally {
      setBusy(false);
    }
  };

  const openQrScanner = async () => {
    try {
      let permission = cameraPermission;

      if (!permission?.granted) {
        permission = await requestCameraPermission();
      }

      if (permission?.granted) {
        setScanned(false);
        setScannerVisible(true);
      } else {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access in your phone settings to scan a wallet QR code.'
        );
      }
    } catch {
      Alert.alert('Camera unavailable', 'Could not open the camera. Please try again.');
    }
  };

  const handleQrScanned = ({ data }) => {
    if (scanned) return;

    setScanned(true);

    const raw = String(data || '').trim();
    let address = raw;

    if (raw.toLowerCase().startsWith('ethereum:')) {
      address = raw.slice('ethereum:'.length).split('@')[0].split('?')[0];
    }

    if (!ethers.isAddress(address)) {
      Alert.alert(
        'QR code not recognised',
        'This QR code does not contain a valid Ethereum wallet address.',
        [
          { text: 'Try again', onPress: () => setScanned(false) },
          {
            text: 'Close scanner',
            style: 'cancel',
            onPress: () => {
              setScannerVisible(false);
              setScanned(false);
            },
          },
        ]
      );
      return;
    }

    setRecipient(ethers.getAddress(address));
    setScannerVisible(false);
    setScanned(false);
    Alert.alert('Address added', 'Check the recipient address before reviewing your transaction.');
  };

  const handleSend = async () => {
    if (selectedNetwork.type !== 'evm') {
      Alert.alert(
        'Sending unavailable',
        `Sending ${selectedNetwork.symbol} is not implemented yet. Your funds will not be affected.`
      );
      return;
    }

    if (!activeEvmWallet) {
      Alert.alert(
        'Wallet locked',
        'Sign in with your wallet password to unlock this network account.'
      );
      return;
    }

    if (!ethers.isAddress(recipient.trim())) {
      Alert.alert('Check recipient', 'Enter a valid EVM wallet address for the selected network.');
      return;
    }

    let value;
    try {
      value = ethers.parseEther(amount.trim());
      if (value <= 0n) throw new Error('Amount must be positive.');
    } catch {
      Alert.alert('Check amount', `Enter a valid ${selectedNetwork.symbol} amount greater than zero.`);
      return;
    }

    Alert.alert(
      'Confirm transaction',
      `Send ${amount.trim()} ${selectedNetwork.symbol} on ${selectedNetwork.name} to ${recipient.trim()}? Transactions may be irreversible. Verify the address and network before continuing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);

            try {
              const hash = await sendTransaction(
                activeEvmWallet.privateKey,
                recipient.trim(),
                amount.trim(),
                networkId
              );

              Alert.alert(
                'Transaction submitted',
                `Transaction hash:\n${hash}`
              );

              setRecipient('');
              setAmount('');
              setTab('Home');

              try {
                const result = await getBalance(activeEvmWallet.address, networkId);
                setBalance(String(result));
              } catch {
                // The transaction was submitted; balance refresh can be retried.
              }
            } catch (error) {
              Alert.alert(
                'Transaction failed',
                error?.message || 'The transaction could not be sent.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (
      importPassword.length < 10 ||
      importPassword !== confirmPassword
    ) {
      Alert.alert(
        'Check password',
        'Use a password of at least 10 characters and confirm it correctly.'
      );
      return;
    }

    try {
      const imported = importWallet(phrase.trim());

      await saveWallet(
        imported.privateKey,
        importPassword,
        phrase.trim()
      );

      setPhrase('');
      setImportPassword('');
      setConfirmPassword('');
      openWallet(imported.privateKey, phrase.trim());
    } catch {
      Alert.alert(
        'Import failed',
        'Check the recovery phrase and try again. Never share it with anyone.'
      );
    }
  };

  const copyAddress = async () => {
    try {
      await Clipboard.setStringAsync(activeAddress);
      Alert.alert('Address copied', 'Your public wallet address has been copied.');
    } catch {
      Alert.alert('Copy failed', 'Could not copy the address. Try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>C</Text>
        </View>
        <ActivityIndicator size="large" color={C.blueLight} />
        <Text style={styles.muted}>Loading CryptoBean…</Text>
      </View>
    );
  }

  if (accountError) {
    return (
      <View style={styles.center}>
        <Brand />
        <Text style={styles.heading}>Account connection problem</Text>
        <Text style={styles.muted}>{accountError}</Text>
        <PrimaryButton
          title="Try again"
          onPress={async () => {
            setAccountError('');
            setLoading(true);
            try {
              const currentCustomer = await getCurrentCustomer();
              setCustomer(currentCustomer);
              if (currentCustomer) {
                const exists = await hasWallet();
                setAuthScreen(exists ? 'login' : 'setup');
              }
            } catch (error) {
              setAccountError(
                error?.message || 'Unable to connect to the account service.'
              );
            } finally {
              setLoading(false);
            }
          }}
        />
      </View>
    );
  }

  if (!customer) {
    return (
      <AccountAuthScreen
        onAuthenticated={async (nextCustomer) => {
          setCustomer(nextCustomer);
          setAccountError('');
          try {
            const exists = await hasWallet();
            setAuthScreen(exists ? 'login' : 'setup');
          } catch (error) {
            setAccountError(
              error?.message || 'Unable to check the local wallet.'
            );
          }
        }}
      />
    );
  }

  if (!wallet) {
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLoginSuccess={openWallet}
          onGoToSetup={() => setAuthScreen('setup')}
        />
      );
    }

    if (authScreen === 'import') {
      return (
        <KeyboardAvoidingView
          style={styles.page}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authContent}
            keyboardShouldPersistTaps="handled"
          >
            <Brand />
            <Text style={styles.heading}>Import your wallet</Text>
            <Text style={styles.muted}>
              Restore an existing wallet using your recovery phrase. It should
              only be entered into your trusted wallet app.
            </Text>

            <Text style={styles.fieldLabel}>RECOVERY PHRASE</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Enter recovery phrase"
              placeholderTextColor={C.subdued}
              value={phrase}
              onChangeText={setPhrase}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              textContentType="none"
            />

            <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 10 characters"
              placeholderTextColor={C.subdued}
              value={importPassword}
              onChangeText={setImportPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor={C.subdued}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PrimaryButton title="Import wallet" onPress={handleImport} />

            <View style={styles.spacer} />
            <SecondaryButton
              title="Back"
              onPress={() => setAuthScreen('setup')}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    return (
      <View style={styles.page}>
        <SetupScreen
          onWalletCreated={openWallet}
          onGoToLogin={() => setAuthScreen('login')}
        />
        <View style={styles.authFooter}>
          <SecondaryButton
            title="Import an existing wallet"
            onPress={() => setAuthScreen('import')}
          />
        </View>
      </View>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case 'Home':
        return (
          <>
            <View style={styles.welcomeRow}>
              <View>
                <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
                <Text style={styles.heading}>Portfolio</Text>
              </View>
              <Pressable
                style={styles.profileButton}
                onPress={() => setTab('Settings')}
                accessibilityRole="button"
                accessibilityLabel="Open wallet settings"
              >
                <Feather name="user" size={21} color={C.white} />
              </Pressable>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <Text style={styles.heroCaption}>{selectedNetwork.symbol} balance</Text>
                <Pressable
                  style={styles.networkPill}
                  onPress={chooseNetwork}
                  accessibilityRole="button"
                  accessibilityLabel="Change blockchain network"
                >
                  <View style={styles.networkDot} />
                  <Text style={styles.networkPillText}>{selectedNetwork.name}</Text>
                  <Feather name="chevron-down" size={13} color={C.text} />
                </Pressable>
              </View>

              <Text style={styles.heroBalance}>
                {Number.parseFloat(balance || '0').toFixed(4)} {selectedNetwork.symbol}
              </Text>
              <Text style={styles.heroSubtext}>
                GBP estimate shown below
              </Text>

              <View style={styles.heroDivider} />

              <Text style={styles.fieldLabel}>WALLET ADDRESS</Text>
              <Pressable
                onPress={copyAddress}
                style={styles.addressCopy}
                accessibilityRole="button"
                accessibilityLabel="Copy wallet address"
              >
                <Text style={styles.heroAddress}>
                  {activeAddress.slice(0, 12)}…{activeAddress.slice(-8)}
                </Text>
                <Feather name="copy" size={17} color={C.blueLight} />
              </Pressable>

              <Pressable
                style={[styles.refreshButton, busy && styles.disabledButton]}
                onPress={refreshBalance}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={15} color={C.white} />
                    <Text style={styles.refreshButtonText}>Refresh balance</Text>
                  </>
                )}
              </Pressable>
            </View>

            <PortfolioDashboard balance={balance} onRefresh={refreshBalance} />

            <SectionTitle title="Quick actions" />
            <View style={styles.actionGrid}>
              {[
                { label: 'Send', icon: 'arrow-up-right', target: 'Send' },
                { label: 'Receive', icon: 'arrow-down-left', target: 'Receive' },
                { label: 'Swap', icon: 'repeat', target: 'Swap' },
                { label: 'Buy', icon: 'plus', target: 'Buy' },
              ].map((action) => (
                <Pressable
                  key={action.target}
                  style={styles.actionTile}
                  onPress={() => setTab(action.target)}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <View style={styles.actionIcon}>
                    <Feather
                      name={action.icon}
                      size={22}
                      color={C.blueLight}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <SectionTitle title="Your assets" action={selectedNetwork.name} />

            <Pressable
              style={styles.assetCard}
              onPress={refreshBalance}
              accessibilityRole="button"
              accessibilityLabel={`Refresh ${selectedNetwork.name} balance`}
            >
              <View style={styles.ethCoin}>
                <Text style={styles.ethCoinText}>Ξ</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{selectedNetwork.name}</Text>
                <Text style={styles.assetTicker}>{selectedNetwork.symbol} · {selectedNetwork.name} network</Text>
              </View>
              <View style={styles.assetAmount}>
                <Text style={styles.assetValue}>
                  {Number.parseFloat(balance || '0').toFixed(4)} {selectedNetwork.symbol}
                </Text>
                <Text style={styles.assetUsd}>See GBP estimate above</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.buyBanner}
              onPress={() => setTab('Buy')}
              accessibilityRole="button"
            >
              <View style={styles.buyBannerIcon}>
                <Feather name="plus" size={22} color={C.white} />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.buyBannerTitle}>Buy crypto</Text>
                <Text style={styles.buyBannerText}>
                  Explore purchase options for your wallet.
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={C.muted} />
            </Pressable>

            <View style={styles.card}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.smallIcon}>
                  <Feather name="bell" size={18} color={C.blueLight} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>ETH price alert</Text>
                  <Text style={styles.mutedSmall}>
                    Set a target price in USD
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Target price in USD"
                placeholderTextColor={C.subdued}
                value={alertPrice}
                onChangeText={setAlertPrice}
                keyboardType="decimal-pad"
              />

              <PrimaryButton
                title="Create price alert"
                onPress={async () => {
                  if (
                    !alertPrice ||
                    !Number.isFinite(Number(alertPrice)) ||
                    Number(alertPrice) <= 0
                  ) {
                    Alert.alert('Check price', 'Enter a valid positive price.');
                    return;
                  }

                  try {
                    const result = await createPriceAlert(
                      wallet.address,
                      'ETH',
                      alertPrice
                    );

                    if (result?.success) {
                      Alert.alert(
                        'Alert created',
                        'Your alert was accepted by the configured service.'
                      );
                      setAlertPrice('');
                    } else {
                      Alert.alert(
                        'Alert unavailable',
                        'The service did not confirm the alert.'
                      );
                    }
                  } catch {
                    Alert.alert(
                      'Alert unavailable',
                      'Could not contact the alert service.'
                    );
                  }
                }}
              />
            </View>
          </>
        );

      case 'Buy':
        return <BuyCryptoScreen walletAddress={wallet.address} />;

      case 'Send':
        return (
          <>
            <ScreenHeader
              title="Send crypto"
              subtitle="Transfer ETH to another Ethereum address."
            />
            <View style={styles.card}>
              <Pressable
                style={styles.scanButton}
                onPress={openQrScanner}
              >
                <Feather name="camera" size={18} color={C.white} />
                <Text style={styles.scanButtonText}>Scan QR code</Text>
              </Pressable>

              {scannerVisible && (
                <View style={styles.scannerWrap}>
                  <Text style={styles.scannerText}>
                    Position an Ethereum wallet QR code inside the camera view.
                  </Text>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanned ? undefined : handleQrScanned}
                  />
                  <Pressable
                    style={styles.scannerClose}
                    onPress={() => {
                      setScannerVisible(false);
                      setScanned(false);
                    }}
                  >
                    <Text style={styles.scanButtonText}>Close scanner</Text>
                  </Pressable>
                </View>
              )}

              <Text style={styles.fieldLabel}>RECIPIENT ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor={C.subdued}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>AMOUNT</Text>
              <View style={styles.amountInputWrap}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={C.subdued}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.amountCurrency}>ETH</Text>
              </View>

              <Text style={styles.mutedSmall}>
                Transactions may be irreversible. Verify the recipient and
                network before sending.
              </Text>

              <View style={styles.spacer} />
              <PrimaryButton
                title={busy ? 'Please wait…' : 'Review and send'}
                onPress={handleSend}
                disabled={busy}
              />
            </View>

            <Text style={styles.warning}>
              Use test funds until transaction handling and network settings
              have been independently verified.
            </Text>
          </>
        );


case 'Receive':
  return (
    <>
      <ScreenHeader
        title="Receive crypto"
        subtitle={`Scan the QR code or copy your address to receive ${selectedNetwork.symbol}.`}
      />

      <View style={styles.receiveCard}>
        <View style={styles.receiveNetwork}>
          <View style={styles.networkDot} />
          <Text style={styles.receiveNetworkText}>
            {selectedNetwork.name} network
          </Text>
        </View>

        <Text style={styles.receiveTitle}>
          Your wallet QR code
        </Text>

        <Text style={styles.receiveDescription}>
          Ask the sender to scan this code with their wallet app.
        </Text>

        <View style={styles.qrFrame}>
          <QRCode
            value={activeAddress}
            size={220}
            color="#0A0B0D"
            backgroundColor="#FFFFFF"
            ecl="H"
          />
        </View>

        <Text style={styles.qrHint}>
          Public wallet address · {selectedNetwork.symbol}
        </Text>

        <View style={styles.receiveDivider} />

        <Text style={styles.fieldLabel}>
          YOUR WALLET ADDRESS
        </Text>

        <View style={styles.receiveAddressBox}>
          <Text
            selectable
            style={styles.receiveAddressText}
          >
            {activeAddress}
          </Text>
        </View>

        <PrimaryButton
          title="Copy wallet address"
          onPress={copyAddress}
        />

        <View style={styles.receiveWarning}>
          <Feather
            name="info"
            size={17}
            color={C.warning}
          />

          <Text style={styles.receiveWarningText}>
            Only receive assets on a compatible network.
            Sending unsupported assets or using the wrong
            network can result in permanent loss.
          </Text>
        </View>
      </View>
    </>
  );

      case 'Wallets':
        return <WalletManagerScreen />;

      case 'NFTs':
        return <NFTsScreen walletAddress={activeAddress} />;

      case 'Staking':
  return <StakeScreenn wallet={wallet} />;

      case 'Swap':
        return (
          <>
            <ScreenHeader
              title="Swap"
              subtitle="Preview a token exchange."
            />
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>YOU PAY</Text>
              <View style={styles.tokenInputCard}>
                <TextInput
                  style={styles.tokenAmountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={C.subdued}
                  keyboardType="decimal-pad"
                />
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>Ξ</Text>
                  <Text style={styles.tokenBadgeLabel}>ETH</Text>
                </View>
              </View>

              <View style={styles.swapIconWrap}>
                <Feather name="arrow-down" size={20} color={C.blueLight} />
              </View>

              <Text style={styles.fieldLabel}>YOU RECEIVE</Text>
              <View style={styles.tokenInputCard}>
                <Text style={styles.tokenAmountOutput}>—</Text>
                <View style={styles.tokenBadge}>
                  <Text style={styles.usdcDot}>$</Text>
                  <Text style={styles.tokenBadgeLabel}>USDC</Text>
                </View>
              </View>

              <Text style={styles.mutedSmall}>
                Live quotes, fees and minimum received amount are not available.
              </Text>

              <View style={styles.spacer} />
              <PrimaryButton
                title="Check amount"
                onPress={() => {
                  try {
                    const value = ethers.parseEther(amount.trim());
                    if (value <= 0n) throw new Error();

                    Alert.alert(
                      'Amount valid',
                      'A live quote is not configured. No transaction was sent.'
                    );
                  } catch {
                    Alert.alert(
                      'Check amount',
                      `Enter a valid ${selectedNetwork.symbol} amount greater than zero.`
                    );
                  }
                }}
              />
            </View>
            <Text style={styles.warning}>
              Preview only. Do not use this screen to make trading decisions.
            </Text>
          </>
        );

      case 'Activity':
        return <ActivityScreen walletAddress={activeAddress} />;

      case 'Security Centre':
        return <SecurityCenterScreen wallet={wallet} />;

      case 'Settings':
        return (
          <>
            <ScreenHeader
              title="Settings"
              subtitle="Manage your local wallet session."
            />
            <View style={styles.card}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.smallIcon}>
                  <Feather name="shield" size={18} color={C.blueLight} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>Wallet details</Text>
                  <Text style={styles.mutedSmall}>{selectedNetwork.name} address</Text>
                </View>
              </View>
              <Text selectable style={styles.addressBox}>
                {activeAddress}
              </Text>
              <SecondaryButton title="Copy address" onPress={copyAddress} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.smallIcon}>
                  <Feather name="user" size={18} color={C.blueLight} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>Customer account</Text>
                  <Text style={styles.mutedSmall}>
                    {customer?.email || 'Signed in'}
                  </Text>
                </View>
              </View>
              <SecondaryButton
                title="Sign out of account"
                onPress={async () => {
                  let signOutFailed = false;

                  try {
                    await logout();
                  } catch {
                    signOutFailed = true;
                  }

                  setCustomer(null);
                  setWallet(null);
                  setMasterPhrase(null);
                  setAuthScreen('login');
                  setTab('Home');

                  if (signOutFailed) {
                    Alert.alert(
                      'Signed out locally',
                      'The account session was cleared on this device, but the server could not confirm sign-out.'
                    );
                  }
                }}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.smallIcon}>
                  <Feather name="lock" size={18} color={C.blueLight} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>Lock wallet</Text>
                  <Text style={styles.mutedSmall}>
                    Return to the password screen on this device.
                  </Text>
                </View>
              </View>
              <PrimaryButton
                title="Lock wallet"
                onPress={() => {
                  setWallet(null);
                  setMasterPhrase(null);
                  setAuthScreen('login');
                  setTab('Home');
                }}
              />
            </View>

            <Text style={styles.warning}>
              This prototype has not been security-audited. Do not use it to
              store significant funds.
            </Text>
          </>
        );

      case 'Markets':
        return <MarketsScreen />;

      case 'More':
        return (
          <>
            <ScreenHeader
              title="More"
              subtitle="Explore wallet features and settings."
            />

            {[
              {
                label: 'Markets',
                description: 'Live crypto prices and your watchlist.',
                icon: 'trending-up',
              },
              {
                label: 'Wallets',
                description: 'Manage multiple accounts and networks.',
                icon: 'layers',
              },
              {
                label: 'NFTs',
                description: 'View NFTs held by your wallet.',
                icon: 'image',
              },
              {
                label: 'Swap',
                description: 'Preview an exchange between tokens.',
                icon: 'repeat',
              },
              {
                label: 'Staking',
                description: 'Explore staking options.',
                icon: 'layers',
              },
              {
                label: 'Activity',
                description: 'View transaction history when connected.',
                icon: 'activity',
              },
              {
                label: 'Settings',
                description: 'Wallet details and security options.',
                icon: 'settings',
              },
              {
                label: 'Security Centre',
                description: 'Biometrics and wallet backup.',
                icon: 'shield',
              },
              {
                label: 'Browser',
                description: 'Browse websites in the wallet browser.',
                icon: 'globe',
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.moreRow}
                onPress={() => setTab(item.label)}
                accessibilityRole="button"
              >
                <View style={styles.moreIconWrap}>
                  <Feather name={item.icon} size={20} color={C.blueLight} />
                </View>
                <View style={styles.moreCopy}>
                  <Text style={styles.moreTitle}>{item.label}</Text>
                  <Text style={styles.moreDescription}>
                    {item.description}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={19}
                  color={C.subdued}
                />
              </Pressable>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.page} onTouchStart={() => activityResetRef.current?.()}>
      <View style={styles.topBar}>
        <Brand compact />
        <Pressable
          style={styles.topBarButton}
          onPress={() => setTab('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Wallet settings"
        >
          <Feather name="settings" size={19} color={C.text} />
        </Pressable>
      </View>

      {tab === 'Browser' ? (
        <View style={styles.browserContainer}>
          <BrowserScreen />
        </View>
      ) : (
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderTab()}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        {TABS.map((item) => {
          const active =
            item.label === 'More'
              ? [
                  'More',
                  'Wallets',
                  'NFTs',
                  'Swap',
                  'Staking',
                  'Activity',
                  'Settings',
                  'Browser',
                ].includes(tab)
              : tab === item.label;

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={styles.navItem}
              onPress={() => setTab(item.label)}
            >
              <Feather
                name={item.icon}
                size={21}
                color={active ? C.blueLight : C.subdued}
              />
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {active ? <View style={styles.navActiveMark} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Brand({ compact = false }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.logoMark}>
        <Text style={styles.logoMarkText}>C</Text>
      </View>
      <Text style={compact ? styles.brandSmall : styles.brand}>
        CryptoBean
      </Text>
    </View>
  );
}

function SectionTitle({ title, action }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionHint}>{action}</Text> : null}
    </View>
  );
}

function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.muted}>{subtitle}</Text>
    </View>
  );
}

function PrimaryButton({ title, onPress, disabled = false }) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function SecondaryButton({ title, onPress }) {
  return (
    <Pressable
      style={styles.secondaryButton}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={28} color={C.blueLight} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.bg,
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 54 : 22,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    color: C.white,
    fontSize: 21,
    fontWeight: '900',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.7,
  },
  brandSmall: {
    fontSize: 21,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
  topBarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
  },
  browserContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    flexGrow: 1,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 30,
  },
  authFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bottomNav: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.nav,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 18 : 7,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
  },
  navLabel: {
    color: C.subdued,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: C.blueLight,
    fontWeight: '800',
  },
  navActiveMark: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: C.blue,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: C.white,
    letterSpacing: -0.6,
  },
  screenHeader: {
    marginBottom: 20,
  },
  heroCard: {
    padding: 24,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCaption: {
    color: C.muted,
    fontSize: 13,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  networkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  networkPillText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
  },
  heroBalance: {
    color: C.white,
    fontSize: 38,
    fontWeight: '800',
    marginTop: 25,
    letterSpacing: -0.8,
  },
  heroSubtext: {
    color: C.muted,
    fontSize: 12,
    marginTop: 8,
  },
  heroDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 22,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 9,
  },
  addressCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroAddress: {
    color: C.text,
    fontSize: 13,
    lineHeight: 20,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: C.blue,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 17,
    marginTop: 20,
    minWidth: 150,
  },
  refreshButtonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '750',
  },
  sectionHint: {
    color: C.muted,
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionTile: {
    width: '23.5%',
    minHeight: 95,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: '700',
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 15,
    marginBottom: 4,
  },
  ethCoin: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ethCoinText: {
    color: C.blueLight,
    fontSize: 26,
    fontWeight: '600',
  },
  assetInfo: {
    flex: 1,
    minWidth: 0,
  },
  assetName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  assetTicker: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  assetAmount: {
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  assetValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  assetUsd: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
  buyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 15,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    gap: 12,
  },
  buyBannerIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBannerCopy: {
    flex: 1,
  },
  buyBannerTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  buyBannerText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    marginTop: 22,
    padding: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  smallIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  muted: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  mutedSmall: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 15,
    color: C.white,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    color: C.white,
    fontSize: 23,
    paddingVertical: 15,
  },
  amountCurrency: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  addressBox: {
    fontSize: 13,
    lineHeight: 21,
    color: C.text,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginVertical: 16,
    overflow: 'hidden',
  },
  receiveIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  receiveTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  receiveDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  tokenInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  tokenAmountInput: {
    flex: 1,
    color: C.white,
    fontSize: 24,
    paddingVertical: 18,
  },
  tokenAmountOutput: {
    color: C.muted,
    fontSize: 24,
    paddingVertical: 18,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.cardAlt,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tokenBadgeText: {
    color: C.blueLight,
    fontSize: 20,
  },
  tokenBadgeLabel: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  usdcDot: {
    color: C.blueLight,
    fontSize: 18,
    fontWeight: '800',
  },
  swapIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: C.blueMuted,
    borderWidth: 3,
    borderColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: -3,
    zIndex: 1,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: C.gold,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: C.black,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  warning: {
    color: C.warning,
    lineHeight: 20,
    fontSize: 12,
    marginTop: 18,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    gap: 13,
  },
  moreIconWrap: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCopy: {
    flex: 1,
  },
  moreTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  moreDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    padding: 24,
    marginTop: 10,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: C.blueMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  flexOne: {
    flex: 1,
  },
  spacer: {
    height: 15,
  },

receiveCard: {
  marginTop: 4,
  padding: 22,
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 24,
  alignItems: 'center',
},

receiveNetwork: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: C.cardAlt,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginBottom: 22,
},

receiveNetworkText: {
  color: C.text,
  fontSize: 12,
  fontWeight: '600',
},

receiveTitle: {
  color: C.white,
  fontSize: 20,
  fontWeight: '800',
  textAlign: 'center',
  marginBottom: 8,
},

receiveDescription: {
  color: C.muted,
  fontSize: 13,
  lineHeight: 20,
  textAlign: 'center',
  marginBottom: 22,
},

qrFrame: {
  backgroundColor: '#FFFFFF',
  padding: 14,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},

qrHint: {
  color: C.muted,
  fontSize: 11,
  marginTop: 12,
},

receiveDivider: {
  height: 1,
  backgroundColor: C.border,
  alignSelf: 'stretch',
  marginVertical: 22,
},

receiveAddressBox: {
  alignSelf: 'stretch',
  backgroundColor: C.bg,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 13,
  padding: 13,
  marginBottom: 16,
},

receiveAddressText: {
  color: C.text,
  fontSize: 12,
  lineHeight: 20,
  textAlign: 'center',
},

receiveWarning: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 9,
  alignSelf: 'stretch',
  marginTop: 18,
},

receiveWarningText: {
  flex: 1,
  color: C.warning,
  fontSize: 11,
  lineHeight: 17,
},

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.blueMuted,
    borderWidth: 1,
    borderColor: C.blue,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  scanButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  scannerWrap: {
    marginBottom: 22,
    padding: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
  },
  scannerText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  camera: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
    borderRadius: 12,
  },
  scannerClose: {
    alignItems: 'center',
    backgroundColor: C.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
});
