import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { register } from '../../api/auth';

export default function RegisterScreen({ navigation, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'expert'
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        phone,
        password,
        role
      });
      if (res.success && res.user) {
        Alert.alert('Account Created', `Welcome to LocalAssist, ${res.user.name}!`);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
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
        <View style={styles.card}>
          <Text style={styles.title}>Join Bengaluru Network</Text>
          <Text style={styles.subtitle}>Create your profile as a newcomer or local helper</Text>

          {/* Role Choice Pills */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
              onPress={() => setRole('user')}
            >
              <Text style={[styles.roleBtnText, role === 'user' && styles.roleBtnTextActive]}>
                📍 I'm New to Bengaluru
              </Text>
              <Text style={[styles.roleSubtext, role === 'user' && styles.roleSubtextActive]}>
                Need help with PG, commute, areas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === 'expert' && styles.roleBtnActive]}
              onPress={() => setRole('expert')}
            >
              <Text style={[styles.roleBtnText, role === 'expert' && styles.roleBtnTextActive]}>
                ⭐ I'm a Local Expert
              </Text>
              <Text style={[styles.roleSubtext, role === 'expert' && styles.roleSubtextActive]}>
                Offer assistance & earn
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rohit Verma"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rohit@gmail.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 9845012345"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Create a strong password"
            />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 18,
  },
  roleContainer: {
    gap: 8,
    marginBottom: 16,
  },
  roleBtn: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  roleBtnTextActive: {
    color: '#1D4ED8',
  },
  roleSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roleSubtextActive: {
    color: '#3B82F6',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  registerBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
