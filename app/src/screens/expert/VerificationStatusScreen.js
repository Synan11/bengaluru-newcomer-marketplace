import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image
} from 'react-native';
import StatusBadge from '../../components/StatusBadge';
import { getMyExpertProfile, applyExpertVerification } from '../../api/experts';

export default function VerificationStatusScreen() {
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [occupation, setOccupation] = useState('');
  const [intro, setIntro] = useState('');
  const [yearsInCity, setYearsInCity] = useState('3');
  const [idDocName, setIdDocName] = useState('sample_govt_id.pdf');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getMyExpertProfile();
      if (res.success && res.expert) {
        setExpert(res.expert);
        setOccupation(res.expert.occupation || '');
        setIntro(res.expert.intro || '');
        setYearsInCity(String(res.expert.years_in_city || 3));
      }
    } catch (err) {
      console.error('Failed to load expert profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!occupation || !intro) {
      Alert.alert('Required', 'Please enter your occupation and introduction.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('occupation', occupation);
      formData.append('intro', intro);
      formData.append('years_in_city', yearsInCity);

      // Attach mock identity document for mobile multipart upload
      formData.append('id_doc', {
        uri: 'file://mock/path/id_document.pdf',
        name: 'aadhaar_card_proof.pdf',
        type: 'application/pdf'
      });

      const res = await applyExpertVerification(formData);
      if (res.success) {
        Alert.alert(
          'Application Submitted! 📄',
          'Your profile and government ID document have been sent to platform administrators for verification.'
        );
        loadProfile();
      }
    } catch (err) {
      Alert.alert('Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const status = expert?.verification_status || 'pending';
  const latestVerification = expert?.verifications?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusTitle}>Verification Status</Text>
          <StatusBadge status={status} />
        </View>

        <Text style={styles.statusDesc}>
          {status === 'verified' ? 'Your profile and ID have been approved by admin. You appear in newcomer search results.' :
           status === 'pending' ? 'Your application is currently pending admin review. You will appear in search once approved.' :
           status === 'suspended' ? 'Your expert privileges are currently suspended due to reports or policy review.' :
           'Your previous application was not approved. You can review remarks and reapply below.'}
        </Text>

        {latestVerification?.remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Admin Remarks:</Text>
            <Text style={styles.remarksText}>"{latestVerification.remarks}"</Text>
          </View>
        ) : null}
      </View>

      {/* Application / Edit Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {status === 'verified' ? 'Update Verified Profile' : 'Identity Verification Application'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Occupation / Role</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="e.g. Student Mentor / Software Engineer / Walking Guide"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years Living in Bengaluru</Text>
          <TextInput
            style={styles.input}
            value={yearsInCity}
            onChangeText={setYearsInCity}
            keyboardType="number-pad"
            placeholder="e.g. 5"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Intro & Local Knowledge</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={intro}
            onChangeText={setIntro}
            placeholder="Explain why newcomers can trust your guidance (e.g. know Koramangala PGs, bus routes, municipal offices)..."
          />
        </View>

        {/* Upload Box */}
        <View style={styles.uploadBox}>
          <Text style={styles.uploadTitle}>📄 Government Identity Document</Text>
          <Text style={styles.uploadSub}>Aadhaar, Passport, Driving License, or College ID</Text>
          <View style={styles.fileRow}>
            <Text style={styles.fileName}>✓ {idDocName}</Text>
            <TouchableOpacity onPress={() => setIdDocName('updated_govt_id_' + Date.now() + '.pdf')}>
              <Text style={styles.changeFile}>Change File</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleApply}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {status === 'verified' ? 'Update Profile Details' : 'Submit For Admin Verification'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  remarksBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 11,
    color: '#78350F',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  uploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  changeFile: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
