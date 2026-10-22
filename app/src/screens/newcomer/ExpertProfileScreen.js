import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { getExpertById, getExpertReviews } from '../../api/experts';
import { submitReport } from '../../api/reports';
import StatusBadge from '../../components/StatusBadge';

export default function ExpertProfileScreen({ route, navigation }) {
  const { expertId } = route.params;
  const [expert, setExpert] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Report modal state
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [expertId]);

  const loadProfile = async () => {
    try {
      const [expData, revData] = await Promise.all([
        getExpertById(expertId),
        getExpertReviews(expertId)
      ]);
      if (expData.success) {
        setExpert(expData.expert);
      }
      if (revData.success) {
        setReviews(revData.reviews || []);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Required', 'Please describe the safety issue or policy violation.');
      return;
    }
    setReporting(true);
    try {
      const res = await submitReport({
        reported_user_id: expert.user_id,
        expert_id: expert.expert_id,
        reason: reportReason.trim()
      });
      if (res.success) {
        Alert.alert('Report Received', 'Platform administration will investigate this matter promptly.');
        setReportModal(false);
        setReportReason('');
      }
    } catch (err) {
      Alert.alert('Report Failed', err.message);
    } finally {
      setReporting(false);
    }
  };

  if (loading || !expert) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Profile Card */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: expert.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' }}
            style={styles.avatar}
          />
          <View style={styles.badgeRow}>
            <StatusBadge status={expert.verification_status} label="ID Verified by Admin" />
          </View>
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={styles.occupation}>{expert.occupation || 'Local Expert'}</Text>
          <Text style={styles.years}>{expert.years_in_city} years living in Bengaluru</Text>

          {/* Smoothed Rating Pill */}
          <View style={styles.ratingPill}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingVal}>{expert.smoothed_rating || '4.0'}</Text>
            <Text style={styles.ratingCount}>
              ({expert.rating_count} verified {expert.rating_count === 1 ? 'review' : 'reviews'})
            </Text>
          </View>
        </View>

        {/* Intro / About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Local Knowledge</Text>
          <Text style={styles.introText}>{expert.intro || 'Experienced local resident.'}</Text>
        </View>

        {/* Services & Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assistance Services & Rates</Text>
          {expert.services?.map((s) => (
            <View key={s.service_id} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{s.service_name}</Text>
                <Text style={styles.serviceDesc}>{s.description}</Text>
              </View>
              <View style={styles.servicePriceBox}>
                <Text style={styles.servicePrice}>₹{s.price}</Text>
                <Text style={styles.serviceUnit}>{s.unit.replace('_', ' ')}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bengaluru Areas Known */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas Known Personally</Text>
          <View style={styles.tagsContainer}>
            {expert.areas?.map((a) => (
              <View key={a.area_id} style={styles.areaTag}>
                <Text style={styles.areaTagText}>📍 {a.area_name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages Spoken</Text>
          <View style={styles.tagsContainer}>
            {expert.languages?.map((l) => (
              <View key={l.language_id} style={styles.langTag}>
                <Text style={styles.langTagText}>🗣️ {l.language_name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Verified Reviews Section (Module M7) */}
        <View style={styles.section}>
          <View style={styles.reviewHeaderRow}>
            <Text style={styles.sectionTitle}>Verified Customer Reviews</Text>
            <Text style={styles.reviewSub}>Only after completed service</Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No customer reviews yet. Expert starts with platform neutral rating.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.review_id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewerName}>{r.reviewer_name}</Text>
                  <View style={styles.starRow}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </View>
                </View>
                <Text style={styles.reviewService}>Service: {r.service_name}</Text>
                <Text style={styles.reviewComment}>"{r.comment}"</Text>
              </View>
            ))
          )}
        </View>

        {/* Safety & Report Button */}
        <TouchableOpacity style={styles.reportBtn} onPress={() => setReportModal(true)}>
          <Text style={styles.reportBtnText}>⚠️ Report Expert or Policy Violation</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Bar with Book Action */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barFrom}>Starting from</Text>
          <Text style={styles.barPrice}>₹{expert.services?.[0]?.price || 400}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Book', { expert })}
        >
          <Text style={styles.bookBtnText}>Book This Expert</Text>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Safety / Policy Violation</Text>
            <Text style={styles.modalSub}>
              Reports are reviewed by platform admins. If verified, experts may be suspended.
            </Text>

            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Describe what occurred (e.g., asked for OTP, broker touting, did not show up)..."
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReportModal(false)}
                disabled={reporting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitReportBtn}
                onPress={handleSendReport}
                disabled={reporting}
              >
                {reporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitReportText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 10,
    backgroundColor: '#F1F5F9',
  },
  badgeRow: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  occupation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  years: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
    gap: 4,
  },
  star: {
    color: '#D97706',
    fontSize: 14,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  ratingCount: {
    fontSize: 11,
    color: '#92400E',
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  introText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  serviceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  servicePriceBox: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  serviceUnit: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaTag: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  areaTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  langTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewSub: {
    fontSize: 10,
    color: '#64748B',
  },
  noReviews: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  starRow: {
    color: '#EAB308',
    fontSize: 12,
  },
  reviewService: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
    fontStyle: 'italic',
  },
  reportBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  reportBtnText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barFrom: {
    fontSize: 10,
    color: '#64748B',
  },
  barPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 12,
    color: '#64748B',
  },
  submitReportBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitReportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
