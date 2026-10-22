import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import AuthStack from './src/navigation/AuthStack';
import NewcomerTabs from './src/navigation/NewcomerTabs';
import ExpertTabs from './src/navigation/ExpertTabs';
import { getStoredToken, setStoredToken } from './src/config';
import { getMe } from './src/api/auth';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        const res = await getMe();
        if (res.success && res.user) {
          setCurrentUser(res.user);
        } else {
          await setStoredToken(null);
        }
      }
    } catch (e) {
      console.log('No active session or server offline:', e.message);
      await setStoredToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {!currentUser ? (
          <AuthStack onLoginSuccess={handleLoginSuccess} />
        ) : currentUser.role === 'expert' ? (
          <ExpertTabs onLogout={handleLogout} user={currentUser} />
        ) : (
          <NewcomerTabs onLogout={handleLogout} user={currentUser} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
