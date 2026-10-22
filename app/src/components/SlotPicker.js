import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['morning', 'afternoon', 'evening'];

export default function SlotPicker({ selectedSlots = [], onToggleSlot, readOnly = false }) {
  // selectedSlots is array of strings e.g. ["Saturday_morning", "Sunday_evening"] or objects { weekday, time_slot }
  const isSelected = (day, time) => {
    return selectedSlots.some(s => {
      if (typeof s === 'string') return s === `${day}_${time}`;
      return s.weekday === day && s.time_slot === time;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.dayHeader]}>Day</Text>
        <Text style={[styles.cell, styles.slotHeader]}>Morning</Text>
        <Text style={[styles.cell, styles.slotHeader]}>Afternoon</Text>
        <Text style={[styles.cell, styles.slotHeader]}>Evening</Text>
      </View>

      {WEEKDAYS.map((day) => (
        <View key={day} style={styles.row}>
          <Text style={[styles.cell, styles.dayLabel]}>{day.substring(0, 3)}</Text>
          {TIME_SLOTS.map((time) => {
            const active = isSelected(day, time);
            return (
              <TouchableOpacity
                key={time}
                disabled={readOnly}
                onPress={() => onToggleSlot && onToggleSlot(day, time)}
                style={[
                  styles.slotBtn,
                  active ? styles.slotBtnActive : styles.slotBtnInactive
                ]}
              >
                <Text style={[styles.slotBtnText, active && styles.slotBtnTextActive]}>
                  {active ? '✓' : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
    paddingLeft: 4,
  },
  slotHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'left',
    paddingLeft: 4,
  },
  slotBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnActive: {
    backgroundColor: '#2563EB',
  },
  slotBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  slotBtnTextActive: {
    color: '#FFFFFF',
  },
});
