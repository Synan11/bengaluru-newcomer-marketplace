import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { getMyBookings, acceptBooking, rejectBooking, completeBooking } from '../../api/bookings';
import StatusBadge from '../../components/StatusBadge';

export default function ExpertRequestsScreen() {
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await getMyBookings();
      if (res.success) {
        setBookings(res.bookings || []);
        setEarnings(res.earningsSummary || null);
      }
    } catch (err) {
      console.error('Failed to load expert requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      const res = await acceptBooking(bookingId);
      if (res.success) {
        Alert.alert('Booking Accepted', 'The newcomer can now proceed with payment.');
        loadRequests();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      const res = await rejectBooking(bookingId);
      if (res.success) {
        Alert.alert('Booking Declined');
        loadRequests();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleComplete = async (bookingId) => {
    Alert.alert(
      'Complete Service',
      'Mark this assistance session completed? This will disburse earnings and invite the newcomer to leave a verified review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Completed',
          onPress: async () => {
            try {
              const res = await completeBooking(bookingId);
              if (res.success) {
                Alert.alert('Service Completed! 🎉', 'Your earnings have been credited to your balance.');
                loadRequests();
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
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
      {/* Earnings Overview Card */}
      {earnings && (
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Expert Payouts & Earnings (80% Share)</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>₹{earnings.totalEarned}</Text>
              <Text style={styles.metricLabel}>Total Disbursed</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>₹{earnings.pendingEarned}</Text>
              <Text style={styles.metricLabel}>In Escrow / Pending</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{earnings.completedBookingsCount}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.booking_id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />
        }
        renderItem={({ item }) => {
          const isRequested = item.status === 'requested';
          const isAccepted = item.status === 'accepted';

          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.newcomerName}>{item.newcomer_name}</Text>
                  <Text style={styles.serviceName}>{item.service_name}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>📅 Date: <Text style={styles.bold}>{item.booking_date}</Text> ({item.time_slot})</Text>
                <Text style={styles.infoText}>📞 Newcomer Phone: <Text style={styles.bold}>{item.newcomer_phone}</Text></Text>
                {item.notes ? (
                  <Text style={styles.notesText}>Request Note: "{item.notes}"</Text>
                ) : null}
              </View>

              <View style={styles.payoutRow}>
                <View>
                  <Text style={styles.payoutLabel}>Your Earning (80%)</Text>
                  <Text style={styles.payoutVal}>₹{item.expert_earning}</Text>
                </View>
                <View style={styles.payoutLabelGroup}>
                  <Text style={styles.clientPaid}>Total Client Price: ₹{item.amount}</Text>
                  <Text style={styles.commissionText}>Platform Fee (20%): -₹{item.commission}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {isRequested && (
                  <>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item.booking_id)}
                    >
                      <Text style={styles.acceptText}>Accept Request</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleReject(item.booking_id)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isAccepted && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleComplete(item.booking_id)}
                  >
                    <Text style={styles.completeText}>Mark Service Completed ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No incoming requests</Text>
            <Text style={styles.emptySub}>Ensure your weekly availability slots are updated so newcomers can book sessions with you.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#1E293B',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
  },
  earningsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  newcomerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceName: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  bold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  payoutLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  payoutVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  payoutLabelGroup: {
    alignItems: 'flex-end',
  },
  clientPaid: {
    fontSize: 11,
    color: '#475569',
  },
  commissionText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  declineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  declineText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 12,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
