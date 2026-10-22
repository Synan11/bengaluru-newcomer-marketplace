import { Platform } from 'react-native';

// In development, Android emulator uses 10.0.2.2 to reach host machine localhost.
// Real devices on same Wi-Fi use host laptop LAN IP.
// iOS Simulator uses localhost.
const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost'
});

export const API_BASE_URL = `http://${DEFAULT_HOST}:5000/api`;
export const SERVER_STATIC_URL = `http://${DEFAULT_HOST}:5000`;

// Fallback memory token storage in case expo-secure-store is running in web preview
let inMemoryToken = null;

export const setStoredToken = async (token) => {
  inMemoryToken = token;
  try {
    const SecureStore = require('expo-secure-store');
    if (token) {
      await SecureStore.setItemAsync('user_token', token);
    } else {
      await SecureStore.deleteItemAsync('user_token');
    }
  } catch (e) {
    // Fallback to in-memory
  }
};

export const getStoredToken = async () => {
  if (inMemoryToken) return inMemoryToken;
  try {
    const SecureStore = require('expo-secure-store');
    const token = await SecureStore.getItemAsync('user_token');
    inMemoryToken = token;
    return token;
  } catch (e) {
    return inMemoryToken;
  }
};
