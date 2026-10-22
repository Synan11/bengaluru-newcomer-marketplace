import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { login } from '../../api/auth';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('rohit.student@gmail.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (customEmail, customPass) => {
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      Alert.alert('Required', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(targetEmail, targetPass);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
          <Text style={styles.title}>LocalAssist</Text>
          <Text style={styles.subtitle}>Verified Assistance for Bengaluru Newcomers</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>Sign in to your newcomer or expert account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rohit.student@gmail.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
            />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Pre-fills */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick Demo Switcher:</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => {
                  setEmail('rohit.student@gmail.com');
                  setPassword('Password@123');
                  handleLogin('rohit.student@gmail.com', 'Password@123');
                }}
              >
                <Text style={styles.demoBtnText}>Newcomer (Rohit)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => {
                  setEmail('kavitha.relocation@gmail.com');
                  setPassword('Password@123');
                  handleLogin('kavitha.relocation@gmail.com', 'Password@123');
                }}
              >
                <Text style={styles.demoBtnText}>Expert (Kavitha)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
