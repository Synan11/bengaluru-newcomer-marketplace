import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ExpertRequestsScreen from '../screens/expert/ExpertRequestsScreen';
import AvailabilityScreen from '../screens/expert/AvailabilityScreen';
import VerificationStatusScreen from '../screens/expert/VerificationStatusScreen';
import ProfileScreen from '../screens/newcomer/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function ExpertTabs({ onLogout, user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let icon = '📬';
          if (route.name === 'Requests') icon = '📬';
          if (route.name === 'Availability') icon = '🕒';
          if (route.name === 'Verification') icon = '🛡️';
          if (route.name === 'ExpertProfile') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        }
      })}
    >
      <Tab.Screen
        name="Requests"
        component={ExpertRequestsScreen}
        options={{ title: 'Booking Requests' }}
      />
      <Tab.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{ title: 'Weekly Slots' }}
      />
      <Tab.Screen
        name="Verification"
        component={VerificationStatusScreen}
        options={{ title: 'ID Verification' }}
      />
      <Tab.Screen
        name="ExpertProfile"
        options={{ title: 'Account' }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
