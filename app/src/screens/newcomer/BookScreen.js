import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { createBooking } from '../../api/bookings';

const TIME_SLOTS = ['morning', 'afternoon', 'evening'];

export default function BookScreen({ route, navigation }) {
  const { expert } = route.params;

  const [selectedServiceId, setSelectedServiceId] = useState(
    expert.services?.[0]?.service_id || 1
  );
  // Default to upcoming Saturday
  const [bookingDate, setBookingDate] = useState('2026-10-24');
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedService = expert.services?.find(s => s.service_id === selectedServiceId) || expert.services?.[0];
  const price = selectedService ? Number(selectedService.price) : 500;
  const platformFee = Number((price * 0.20).toFixed(2));
  const expertEarning = Number((price - platformFee).toFixed(2));

  const handleConfirmBooking = async () => {
    if (!bookingDate) {
      Alert.alert('Required', 'Please enter a booking date.');
      return;
    }

    setLoading(true);
    try {
      const res = await createBooking({
        expert_id: expert.expert_id,
        service_id: selectedServiceId,
        booking_date: bookingDate,
        time_slot: selectedSlot,
        notes: notes.trim()
      });

      if (res.success) {
        Alert.alert(
          'Booking Requested! 🚀',
          `Your request has been dispatched to ${expert.name}. Once accepted by the expert, you will receive a notification to complete mock payment.`,
          [{ text: 'View My Bookings', onPress: () => navigation.navigate('MyBookings') }]
        );
      }
    } catch (err) {
      Alert.alert('Booking Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.expertSummaryCard}>
        <Text style={styles.cardHeader}>Booking With Local Expert</Text>
        <Text style={styles.expertName}>{expert.name}</Text>
        <Text style={styles.expertOccupation}>{expert.occupation || 'Local Expert'}</Text>
      </View>

      {/* 1. Select Service */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Choose Assistance Service</Text>
        {expert.services?.map((s) => {
          const active = s.service_id === selectedServiceId;
          return (
            <TouchableOpacity
              key={s.service_id}
              style={[styles.serviceOption, active && styles.serviceOptionActive]}
              onPress={() => setSelectedServiceId(s.service_id)}
            >
              <View style={styles.serviceTextGroup}>
                <Text style={[styles.serviceName, active && styles.serviceNameActive]}>
                  {s.service_name}
                </Text>
                <Text style={styles.serviceDesc}>{s.description}</Text>
              </View>
              <Text style={[styles.servicePrice, active && styles.servicePriceActive]}>
                ₹{s.price}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Choose Date & Time Slot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Choose Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.dateInput}
          value={bookingDate}
          onChangeText={setBookingDate}
          placeholder="2026-10-24"
        />

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>3. Time Slot</Text>
        <View style={styles.slotRow}>
          {TIME_SLOTS.map((slot) => {
            const active = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, active && styles.slotChipActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={[styles.slotText, active && styles.slotTextActive]}>
                  {slot.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Notes / Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Notes & Location Preferences</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Need to visit 2 PGs on 5th Cross Koramangala near Sony Signal..."
        />
      </View>

      {/* Pricing & Commission Breakdown */}
      <View style={styles.priceSummaryCard}>
        <Text style={styles.summaryTitle}>Estimated Pricing & Guarantee</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Amount</Text>
          <Text style={styles.summaryVal}>₹{price.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Platform Commission (20%)</Text>
          <Text style={styles.summaryVal}>₹{platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expert Direct Earning (80%)</Text>
          <Text style={styles.summaryVal}>₹{expertEarning.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotalRow]}>
          <Text style={styles.totalLabel}>Total Payable (Upon Acceptance)</Text>
          <Text style={styles.totalVal}>₹{price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Submit Action */}
      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={handleConfirmBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmBtnText}>Confirm Booking Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  expertSummaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  expertName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  expertOccupation: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  serviceOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  serviceTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  serviceNameActive: {
    color: '#1D4ED8',
  },
  serviceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  servicePriceActive: {
    color: '#1D4ED8',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  slotChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    height: 70,
    textAlignVertical: 'top',
  },
  priceSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
