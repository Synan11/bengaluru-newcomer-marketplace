import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from 'react-native';
import ExpertCard from '../../components/ExpertCard';
import { searchExperts } from '../../api/experts';

export default function ResultsScreen({ route, navigation }) {
  const { searchParams } = route.params || {};
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    executeSearch();
  }, [searchParams]);

  const executeSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await searchExperts(searchParams);
      if (data.success) {
        setResults(data.results || []);
      } else {
        setError(data.message || 'Failed to search experts.');
      }
    } catch (err) {
      setError(err.message || 'Network error during search.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    executeSearch();
  };

  return (
    <View style={styles.container}>
      {/* Search Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerInfo}>
          <Text style={styles.resultsCount}>
            {loading ? 'Ranking matches...' : `${results.length} Verified Local Experts Ranked`}
          </Text>
          <Text style={styles.resultsSub}>
            Ordered by explainable trust, need coverage, area, and availability.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.modifyBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.modifyBtnText}>Edit Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingMsg}>Computing Bayesian Trust & Service Coverage...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={executeSearch}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.expert_id)}
          renderItem={({ item }) => (
            <ExpertCard
              expert={item}
              onPress={() => navigation.navigate('ExpertProfile', { expertId: item.expert_id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No exact match found</Text>
              <Text style={styles.emptySub}>
                {searchParams?.strict
                  ? 'Strict matching was enabled. Try turning off strict mode to see high-ranking alternative experts.'
                  : 'Try adjusting your preferred day, time slot, or neighborhood.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.emptyActionText}>Adjust Search Criteria</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modifyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
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
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
