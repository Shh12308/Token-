import notifee, { AndroidImportance } from '@notifee/react-native';
import axios from 'axios';

// 1. Create a notification channel (Android specific)
export const setupNotifications = async () => {
  await notifee.createChannel({
    id: 'price-alerts',
    name: 'Price Alerts',
    importance: AndroidImportance.HIGH,
  });
};

// 2. Trigger Alert
export const checkPriceAndAlert = async (targetPrice, currentPrice) => {
  const channelId = 'price-alerts';

  if (currentPrice <= targetPrice) {
    await notifee.displayNotification({
      title: 'Price Alert! 🚀',
      body: `ETH has hit your target of $${targetPrice}!`,
      android: { channelId },
    });
  }
};
