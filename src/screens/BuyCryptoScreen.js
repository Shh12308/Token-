import React, { useState } from 'react';
import { getBuyUrl } from '../services/fiat';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MOONPAY_KEY =
  process.env.EXPO_PUBLIC_MOONPAY_PUBLISHABLE_KEY || '';

const TRANSAK_KEY =
  process.env.EXPO_PUBLIC_TRANSAK_API_KEY || '';

const BLUE = '#3978FF';
const BG = '#0A0D14';
const CARD = '#121824';
const BORDER = '#263247';
const WHITE = '#F5F7FC';
const MUTED = '#9BA9C1';

export default function BuyCryptoScreen({ walletAddress }) {
  const [amount, setAmount] = useState('100');
  const [provider, setProvider] = useState('MoonPay');
  const address =
    typeof walletAddress === 'string' ? walletAddress.trim() : '';

  const parsedAmount = Number(amount);
  const validAmount =
    amount.trim() !== '' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 10 &&
    parsedAmount <= 10000;

  const openProvider = async () => {
    if (!address) {
      Alert.alert(
        'Wallet unavailable',
        'Unlock or create your wallet before starting checkout.'
      );
      return;
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      Alert.alert(
        'Invalid wallet address',
        'The current wallet address is not a valid Ethereum address.'
      );
      return;
    }

    if (!validAmount) {
      Alert.alert(
        'Check purchase amount',
        'Enter an amount between $10 and $10,000 USD.'
      );
      return;
    }

    let url;

    if (provider === 'MoonPay') {
      try {
        url = await getBuyUrl(address, parsedAmount);
      } catch (error) {
        Alert.alert(
          'MoonPay checkout unavailable',
          error?.message || 'The purchase service is unavailable. Please try again later.'
        );
        return;
      }
    } else {
      if (!TRANSAK_KEY) {
        Alert.alert(
          'Transak staging key required',
          'Configure EXPO_PUBLIC_TRANSAK_API_KEY in your .env file with your staging API key, then restart Expo.'
        );
        return;
      }

      const params = new URLSearchParams({
        apiKey: TRANSAK_KEY,
        walletAddress: address,
        defaultCryptoCurrency: 'ETH',
        networks: 'ethereum',
        fiatCurrency: 'USD',
        fiatAmount: String(parsedAmount),
      });

      url = `https://global-stg.transak.com/?${params.toString()}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'Unable to open checkout',
          'Your device could not open the provider checkout link.'
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open checkout',
        'Check your internet connection and try again.'
      );
    }
  };

  const setPreset = (value) => setAmount(String(value));

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Text style={styles.headingIconText}>↗</Text>
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>YOUR NEXT MOVE</Text>
          <Text style={styles.title}>Buy crypto</Text>
          <Text style={styles.subtitle}>
            Add Ethereum to your wallet in a few simple steps.
          </Text>
        </View>
      </View>

      <View style={styles.amountCard}>
        <View style={styles.sectionRow}>
          <Text style={styles.label}>YOU SPEND</Text>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyPillText}>USD  ▾</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            accessibilityLabel="Purchase amount in US dollars"
            style={styles.amountInput}
            value={amount}
            onChangeText={(value) =>
              setAmount(value.replace(/[^0-9.]/g, ''))
            }
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor="#64718A"
            maxLength={8}
            selectTextOnFocus
          />
        </View>

        <Text style={styles.helper}>
          Choose an amount between $10 and $10,000.
        </Text>

        <View style={styles.presets}>
          {[50, 100, 250, 500].map((value) => {
            const selected = Number(amount) === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPreset(value)}
                style={[
                  styles.preset,
                  selected && styles.presetSelected,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    selected && styles.presetTextSelected,
                  ]}
                >
                  ${value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        <View style={styles.receiveRow}>
          <View style={styles.ethIcon}>
            <Text style={styles.ethIconText}>◆</Text>
          </View>
          <View style={styles.receiveCopy}>
            <Text style={styles.receiveTitle}>Ethereum</Text>
            <Text style={styles.receiveSubtitle}>
              ETH · Ethereum network
            </Text>
          </View>
          <View style={styles.receiveBadge}>
            <Text style={styles.receiveBadgeText}>ETH</Text>
          </View>
        </View>

        <Text style={styles.quoteNote}>
          The provider will show the final ETH amount, exchange rate and
          fees before you confirm your purchase.
        </Text>
      </View>

      <View style={styles.providerSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Choose a provider</Text>
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Select where you want to complete your purchase.
        </Text>

        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: provider === 'MoonPay' }}
          onPress={() => setProvider('MoonPay')}
          style={[
            styles.providerCard,
            provider === 'MoonPay' && styles.providerSelected,
          ]}
        >
          <View style={[styles.providerLogo, styles.moonpayLogo]}>
            <Text style={styles.providerLogoText}>M</Text>
          </View>
          <View style={styles.providerCopy}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>MoonPay</Text>
              {provider === 'MoonPay' && (
                <View style={styles.selectedPill}>
                  <Text style={styles.selectedPillText}>SELECTED</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerDescription}>
              Open the MoonPay sandbox checkout.
            </Text>
          </View>
          <View style={styles.radioOuter}>
            {provider === 'MoonPay' && <View style={styles.radioInner} />}
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: provider === 'Transak' }}
          onPress={() => setProvider('Transak')}
          style={[
            styles.providerCard,
            provider === 'Transak' && styles.providerSelected,
          ]}
        >
          <View style={[styles.providerLogo, styles.transakLogo]}>
            <Text style={styles.providerLogoText}>T</Text>
          </View>
          <View style={styles.providerCopy}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>Transak</Text>
              {provider === 'Transak' && (
                <View style={styles.selectedPill}>
                  <Text style={styles.selectedPillText}>SELECTED</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerDescription}>
              Open the Transak staging checkout.
            </Text>
          </View>
          <View style={styles.radioOuter}>
            {provider === 'Transak' && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      </View>

      <View style={styles.testNotice}>
        <Text style={styles.noticeIcon}>ⓘ</Text>
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>Sandbox / staging mode</Text>
          <Text style={styles.noticeText}>
            This integration is for testing. Do not enter real payment
            details or assume a purchase will complete.
          </Text>
        </View>
      </View>

      <View style={styles.securityRow}>
        <Text style={styles.securityIcon}>⌑</Text>
        <Text style={styles.securityText}>
          Your wallet key stays in CryptoBean. Checkout is handled by the
          selected provider.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!validAmount}
        onPress={openProvider}
        style={[
          styles.buyButton,
          !validAmount && styles.buyButtonDisabled,
        ]}
      >
        <Text style={styles.buyButtonText}>
          Continue to {provider}
        </Text>
        <Text style={styles.buyButtonArrow}>↗</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        Review the destination address, network, fees and provider terms
        before confirming a transaction.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 28,
    gap: 18,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 2,
  },
  headingIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#173A78',
    borderWidth: 1,
    borderColor: '#2D5DC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingIconText: {
    color: '#8DB5FF',
    fontSize: 30,
    fontWeight: '700',
  },
  headingCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: '#7FA7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: WHITE,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  amountCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    padding: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  currencyPill: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#182131',
  },
  currencyPillText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  dollar: {
    color: WHITE,
    fontSize: 34,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    color: WHITE,
    fontSize: 38,
    fontWeight: '800',
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  helper: {
    color: '#7F8DA5',
    fontSize: 11,
    marginTop: 1,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  preset: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#182131',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetSelected: {
    backgroundColor: '#1C4EB4',
    borderColor: BLUE,
  },
  presetText: {
    color: '#C1CBE0',
    fontSize: 12,
    fontWeight: '700',
  },
  presetTextSelected: {
    color: WHITE,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 18,
  },
  receiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ethIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#304DAD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ethIconText: {
    color: WHITE,
    fontSize: 23,
  },
  receiveCopy: {
    flex: 1,
    gap: 4,
  },
  receiveTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  receiveSubtitle: {
    color: MUTED,
    fontSize: 11,
  },
  receiveBadge: {
    backgroundColor: '#182131',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  receiveBadgeText: {
    color: '#A9C3FF',
    fontSize: 11,
    fontWeight: '800',
  },
  quoteNote: {
    color: '#8D9BB3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 13,
  },
  providerSection: {
    gap: 10,
  },
  sectionTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '800',
  },
  stepLabel: {
    color: '#8295B7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 2,
  },
  providerCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
  },
  providerSelected: {
    borderColor: BLUE,
    backgroundColor: '#121E34',
  },
  providerLogo: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonpayLogo: {
    backgroundColor: '#354A9D',
  },
  transakLogo: {
    backgroundColor: '#176C68',
  },
  providerLogoText: {
    color: WHITE,
    fontSize: 21,
    fontWeight: '900',
  },
  providerCopy: {
    flex: 1,
    gap: 5,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  providerName: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
  providerDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  selectedPill: {
    backgroundColor: '#1D3D72',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  selectedPillText: {
    color: '#A9C7FF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#647895',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLUE,
  },
  testNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    backgroundColor: '#292619',
    borderWidth: 1,
    borderColor: '#51462B',
    borderRadius: 15,
  },
  noticeIcon: {
    color: '#F3C96A',
    fontSize: 17,
    fontWeight: '800',
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: '#F3D58B',
    fontSize: 12,
    fontWeight: '800',
  },
  noticeText: {
    color: '#D8CBA7',
    fontSize: 11,
    lineHeight: 17,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 2,
  },
  securityIcon: {
    color: '#8DB5FF',
    fontSize: 18,
    fontWeight: '800',
  },
  securityText: {
    flex: 1,
    color: '#94A3BC',
    fontSize: 11,
    lineHeight: 17,
  },
  buyButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buyButtonDisabled: {
    opacity: 0.45,
  },
  buyButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
  buyButtonArrow: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '800',
  },
  disclaimer: {
    color: '#74829A',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
