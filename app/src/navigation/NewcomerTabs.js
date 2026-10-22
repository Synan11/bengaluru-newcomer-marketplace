import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/newcomer/HomeScreen';
import ResultsScreen from '../screens/newcomer/ResultsScreen';
import ExpertProfileScreen from '../screens/newcomer/ExpertProfileScreen';
import BookScreen from '../screens/newcomer/BookScreen';
import MyBookingsScreen from '../screens/newcomer/MyBookingsScreen';
import ProfileScreen from '../screens/newcomer/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerTintColor: '#0F172A'
      }}
    >
      <Stack.Screen
        name="Explore"
        component={HomeScreen}
        options={{ title: 'LocalAssist Bengaluru' }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: 'Ranked Local Experts' }}
      />
      <Stack.Screen
        name="ExpertProfile"
        component={ExpertProfileScreen}
        options={{ title: 'Expert Profile' }}
      />
      <Stack.Screen
        name="Book"
        component={BookScreen}
        options={{ title: 'Request Assistance' }}
      />
    </Stack.Navigator>
  );
}

export default function NewcomerTabs({ onLogout, user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
          let icon = '🔍';
          if (route.name === 'SearchTab') icon = '🔍';
          if (route.name === 'MyBookings') icon = '📅';
          if (route.name === 'UserProfile') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        }
      })}
    >
      <Tab.Screen
        name="SearchTab"
        component={HomeStack}
        options={{ title: 'Find Experts' }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          headerShown: true,
          title: 'My Bookings',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontWeight: '700', fontSize: 16 }
        }}
      />
      <Tab.Screen
        name="UserProfile"
        options={{
          headerShown: true,
          title: 'My Profile',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontWeight: '700', fontSize: 16 }
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
