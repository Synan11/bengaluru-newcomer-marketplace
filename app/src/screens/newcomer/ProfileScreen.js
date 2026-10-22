import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { getMe, logout } from '../../api/auth';
import StatusBadge from '../../components/StatusBadge';

export default function ProfileScreen({ navigation, onLogout, user }) {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getMe();
      if (res.success && res.user) {
        setProfile(res.user);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{profile?.name || 'Local User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.phone}>📞 {profile?.phone}</Text>

        <View style={styles.badgeRow}>
          <StatusBadge status={profile?.role} label={`${profile?.role} Account`} />
          <StatusBadge status={profile?.status} />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About This Platform</Text>
        <Text style={styles.infoDesc}>
          LocalAssist connects Bengaluru newcomers with identity-verified local residents.
          Reviews are strictly permitted only upon completed bookings. A 20% platform commission is recorded per transaction.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log Out of Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  email: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  phone: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 13,
  },
});
