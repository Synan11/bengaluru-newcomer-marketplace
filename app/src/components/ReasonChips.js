import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReasonChips({ chips = [] }) {
  if (!chips || chips.length === 0) return null;

  return (
    <View style={styles.container}>
      {chips.map((chip, index) => {
        const isMatchNeed = chip.includes('Covers');
        const isArea = chip.includes('Knows');
        const isRating = chip.includes('rating');

        return (
          <View
            key={index}
            style={[
              styles.chip,
              isMatchNeed ? styles.chipNeed :
              isArea ? styles.chipArea :
              isRating ? styles.chipRating : styles.chipDefault
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isMatchNeed ? styles.chipTextNeed :
                isArea ? styles.chipTextArea :
                isRating ? styles.chipTextRating : styles.chipTextDefault
              ]}
              numberOfLines={1}
            >
              ✓ {chip}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipNeed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  chipArea: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipRating: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  chipDefault: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextNeed: {
    color: '#1D4ED8',
  },
  chipTextArea: {
    color: '#15803D',
  },
  chipTextRating: {
    color: '#B45309',
  },
  chipTextDefault: {
    color: '#475569',
  },
});
