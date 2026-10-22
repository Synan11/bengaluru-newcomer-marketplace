import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput
} from 'react-native';
import { getMyBookings, mockPayBooking, cancelBooking } from '../../api/bookings';
import { submitReview } from '../../api/reviews';
import StatusBadge from '../../components/StatusBadge';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await getMyBookings();
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load my bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePay = async (bookingId, amount) => {
    Alert.alert(
      'Simulate Mock Payment',
      `Pay ₹${amount} for this verified local assistance booking? (20% commission recorded for platform, 80% to expert)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay ₹' + amount,
          onPress: async () => {
            try {
              const res = await mockPayBooking(bookingId);
              if (res.success) {
                Alert.alert(
                  'Payment Successful! 💳',
                  `Receipt #${res.receipt.booking_id}\nPlatform Commission: ₹${res.receipt.platform_commission_20pct}\nExpert Payout: ₹${res.receipt.expert_payout_80pct}`
                );
                loadBookings();
              }
            } catch (err) {
              Alert.alert('Payment Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleCancel = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelBooking(bookingId);
              if (res.success) {
                Alert.alert('Booking Cancelled');
                loadBookings();
              }
            } catch (err) {
              Alert.alert('Cancel Failed', err.message);
            }
          }
        }
      ]
    );
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please write a brief feedback comment for other newcomers.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await submitReview(selectedBooking.booking_id, rating, comment.trim());
      if (res.success) {
        Alert.alert('Review Verified! ⭐', 'Your feedback has been added and the expert smoothed rating has been updated.');
        setReviewModal(false);
        loadBookings();
      }
    } catch (err) {
      Alert.alert('Review Error', err.message);
    } finally {
      setSubmittingReview(false);
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
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.booking_id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} />
        }
        renderItem={({ item }) => {
          const canPay = item.status === 'accepted' && item.payment_status === 'unpaid';
          const canReview = item.status === 'completed' && !item.review_id;
          const canCancel = ['requested', 'accepted'].includes(item.status);

          return (
            <View style={styles.bookingCard}>
              {/* Top row */}
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.expertName}>{item.expert_name}</Text>
                  <Text style={styles.serviceName}>{item.service_name}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {/* Timing & Notes */}
              <View style={styles.detailsBox}>
                <Text style={styles.detailText}>📅 Date: <Text style={styles.boldText}>{item.booking_date}</Text> ({item.time_slot})</Text>
                <Text style={styles.detailText}>📞 Expert Phone: <Text style={styles.boldText}>{item.expert_phone}</Text></Text>
                {item.notes ? (
                  <Text style={styles.notesText}>Note: "{item.notes}"</Text>
                ) : null}
              </View>

              {/* Payment status row */}
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.amountVal}>₹{item.amount}</Text>
                </View>
                <View style={styles.paymentBadge}>
                  <Text style={[styles.payStatusText, item.payment_status === 'paid' ? styles.payPaid : styles.payUnpaid]}>
                    ● {item.payment_status === 'paid' ? 'Paid (Mock Gateway)' : 'Payment Pending'}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                {canPay && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => handlePay(item.booking_id, item.amount)}
                  >
                    <Text style={styles.payBtnText}>Pay Now (₹{item.amount})</Text>
                  </TouchableOpacity>
                )}

                {canReview && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => openReviewModal(item)}
                  >
                    <Text style={styles.reviewBtnText}>⭐ Leave Verified Review</Text>
                  </TouchableOpacity>
                )}

                {item.review_id && (
                  <View style={styles.reviewedBadge}>
                    <Text style={styles.reviewedText}>✓ Reviewed ({item.user_review_rating} ★)</Text>
                  </View>
                )}

                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item.booking_id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySub}>Explore verified local experts on the Home tab and request your first assistance session.</Text>
          </View>
        }
      />

      {/* Review Modal */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Leave Verified Customer Review</Text>
            <Text style={styles.modalSub}>
              Reviewing service with <Text style={styles.boldText}>{selectedBooking?.expert_name}</Text>
            </Text>

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.starBtn, star <= rating ? styles.starFilled : styles.starEmpty]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{rating} of 5 Stars</Text>

            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
              placeholder="How did the expert help you? (e.g., showed safe PGs, negotiated deposit, guided metro route)..."
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setReviewModal(false)}
                disabled={submittingReview}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmit}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Post Verified Review</Text>
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
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  expertName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceName: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentBadge: {
    alignItems: 'flex-end',
  },
  payStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payPaid: {
    color: '#16A34A',
  },
  payUnpaid: {
    color: '#D97706',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  payBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  reviewBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  reviewedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reviewedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
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
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  starBtn: {
    fontSize: 32,
  },
  starFilled: {
    color: '#EAB308',
  },
  starEmpty: {
    color: '#CBD5E1',
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSubmit: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
