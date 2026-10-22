import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import ReasonChips from './ReasonChips';
import StatusBadge from './StatusBadge';

export default function ExpertCard({ expert, onPress }) {
  const ranking = expert.ranking || {};
  const smoothedRating = ranking.smoothedRating || (expert.rating_count > 0 ? (expert.rating_sum / expert.rating_count).toFixed(1) : '4.0');
  const reviewCount = expert.rating_count || 0;
  const reasonChips = ranking.reasonChips || [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Image
          source={{ uri: expert.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{expert.name}</Text>
            {ranking.score !== undefined && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{(ranking.score * 100).toFixed(0)}% Match</Text>
              </View>
            )}
          </View>
          <Text style={styles.occupation}>{expert.occupation || 'Local Helper'}</Text>
          <Text style={styles.subtext}>{expert.years_in_city || 1} years resident in Bengaluru</Text>
        </View>
      </View>

      <Text style={styles.intro} numberOfLines={2}>
        "{expert.intro || 'Local expert ready to guide newcomers.'}"
      </Text>

      {/* Explainable Reasons */}
      <ReasonChips chips={reasonChips} />

      {/* Footer with Rating and Starting Price */}
      <View style={styles.footer}>
        <View style={styles.ratingBox}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.ratingVal}>{smoothedRating}</Text>
          <Text style={styles.reviewCount}>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceVal}>₹{expert.startingPrice || 400}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  occupation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  subtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  intro: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: '#EAB308',
    fontSize: 14,
    marginRight: 4,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#64748B',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
});
