import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatusBadge({ status, label }) {
  const normalized = (status || '').toLowerCase();

  let bg = '#F1F5F9';
  let text = '#475569';

  if (['completed', 'verified', 'paid', 'resolved'].includes(normalized)) {
    bg = '#DCFCE7';
    text = '#15803D';
  } else if (['accepted', 'under_review'].includes(normalized)) {
    bg = '#DBEAFE';
    text = '#1D4ED8';
  } else if (['requested', 'pending', 'open', 'investigating'].includes(normalized)) {
    bg = '#FEF3C7';
    text = '#B45309';
  } else if (['cancelled', 'rejected', 'suspended'].includes(normalized)) {
    bg = '#FEE2E2';
    text = '#B91C1C';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>
        {label || normalized.replace('_', ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
