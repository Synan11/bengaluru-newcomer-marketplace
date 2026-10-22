import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import SlotPicker from '../../components/SlotPicker';
import { getMyExpertProfile, updateAvailabilitySlots } from '../../api/experts';

export default function AvailabilityScreen() {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const res = await getMyExpertProfile();
      if (res.success && res.expert) {
        const slots = (res.expert.slots || []).map(s => `${s.weekday}_${s.time_slot}`);
        setSelectedSlots(slots);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (day, time) => {
    const key = `${day}_${time}`;
    if (selectedSlots.includes(key)) {
      setSelectedSlots(selectedSlots.filter(s => s !== key));
    } else {
      setSelectedSlots([...selectedSlots, key]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = selectedSlots.map(s => {
        const [weekday, time_slot] = s.split('_');
        return { weekday, time_slot };
      });
      const res = await updateAvailabilitySlots(payload);
      if (res.success) {
        Alert.alert('Saved! ✅', 'Your weekly availability slots have been updated.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Weekly Availability Schedule</Text>
        <Text style={styles.subtitle}>
          Tap the time slots you are free to guide newcomers. This directly influences your matching score (A component: 0.10).
        </Text>
      </View>

      <SlotPicker
        selectedSlots={selectedSlots}
        onToggleSlot={toggleSlot}
      />

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Availability Grid</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
