import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, ActivityIndicator, Alert
} from 'react-native';
import { fetchServices, fetchAreas, fetchLanguages } from '../../api/reference';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['morning', 'afternoon', 'evening'];

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([
    { id: 'housing_relocation', label: '🏠 Housing & PG', icon: '🏠' },
    { id: 'city_exploration', label: '🌆 City & Living', icon: '🌆' },
    { id: 'transport_guidance', label: '🚌 Commute & Metro', icon: '🚌' },
    { id: 'government_guidance', label: '🏛️ Civic & Govt', icon: '🏛️' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('housing_relocation');

  const [allServices, setAllServices] = useState([]);
  const [selectedNeeds, setSelectedNeeds] = useState([1, 2]); // default benchmark needs: PG search + Rental survey
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(1); // Koramangala default
  const [languages, setLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([3]); // Hindi default
  const [selectedDay, setSelectedDay] = useState('Saturday');
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [isStrict, setIsStrict] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [srvRes, areaRes, langRes] = await Promise.all([
        fetchServices(),
        fetchAreas(),
        fetchLanguages()
      ]);
      setAllServices(srvRes.services || []);
      setAreas(areaRes.areas || []);
      setLanguages(langRes.languages || []);
    } catch (err) {
      console.error('Failed to load search references:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNeed = (serviceId) => {
    if (selectedNeeds.includes(serviceId)) {
      setSelectedNeeds(selectedNeeds.filter(id => id !== serviceId));
    } else {
      setSelectedNeeds([...selectedNeeds, serviceId]);
    }
  };

  const toggleLanguage = (langId) => {
    if (selectedLanguages.includes(langId)) {
      setSelectedLanguages(selectedLanguages.filter(id => id !== langId));
    } else {
      setSelectedLanguages([...selectedLanguages, langId]);
    }
  };

  const handleSearch = () => {
    navigation.navigate('Results', {
      searchParams: {
        category: selectedCategory,
        needs: selectedNeeds,
        area: selectedArea,
        languages: selectedLanguages,
        day: selectedDay,
        slot: selectedSlot,
        strict: isStrict
      }
    });
  };

  const filteredServices = allServices.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Bengaluru Services...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* City Banner */}
      <View style={styles.cityBanner}>
        <View style={styles.badgeRow}>
          <Text style={styles.cityTag}>Bengaluru Central MVP</Text>
          <Text style={styles.trustBadge}>🛡️ 100% ID Verified Experts</Text>
        </View>
        <Text style={styles.bannerTitle}>Find practical local help for settling into Bengaluru</Text>
        <Text style={styles.bannerSub}>Get paired with long-term residents for PG visits, rental checks, and commute advice.</Text>
      </View>

      {/* 1. Category Tabs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Newcomer Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.categoryTab, selectedCategory === c.id && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === c.id && styles.categoryTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2. Specific Needs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Specific Needs in This Category</Text>
        <Text style={styles.helperText}>Select the tasks you need the expert to cover</Text>
        <View style={styles.chipsContainer}>
          {filteredServices.map((service) => {
            const active = selectedNeeds.includes(service.service_id);
            return (
              <TouchableOpacity
                key={service.service_id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleNeed(service.service_id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? '✓ ' : '+ '} {service.service_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Bengaluru Neighborhood */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Preferred Bengaluru Neighborhood</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainerRow}>
          {areas.slice(0, 12).map((a) => {
            const active = selectedArea === a.area_id;
            return (
              <TouchableOpacity
                key={a.area_id}
                style={[styles.areaChip, active && styles.areaChipActive]}
                onPress={() => setSelectedArea(a.area_id)}
              >
                <Text style={[styles.areaChipText, active && styles.areaChipTextActive]}>
                  {a.area_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Communication Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Spoken Languages</Text>
        <View style={styles.chipsContainer}>
          {languages.map((l) => {
            const active = selectedLanguages.includes(l.language_id);
            return (
              <TouchableOpacity
                key={l.language_id}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => toggleLanguage(l.language_id)}
              >
                <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. Date & Time Slot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Preferred Day & Time Slot</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {WEEKDAYS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
              onPress={() => setSelectedDay(d)}
            >
              <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                {d.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.slotRow}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotChipText, selectedSlot === slot && styles.slotChipTextActive]}>
                {slot.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Strict Toggle */}
      <View style={styles.strictCard}>
        <View style={styles.strictInfo}>
          <Text style={styles.strictTitle}>Strict Matching Mode</Text>
          <Text style={styles.strictSub}>
            {isStrict 
              ? 'Hard filter: only experts matching all criteria are returned.' 
              : 'Ranked scoring: shows best matches with explainable scores even if partially matched.'}
          </Text>
        </View>
        <Switch
          value={isStrict}
          onValueChange={setIsStrict}
          trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
          thumbColor={isStrict ? '#2563EB' : '#F1F5F9'}
        />
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
        <Text style={styles.searchBtnText}>Search & Rank Local Experts 🔍</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  cityBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cityTag: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  trustBadge: {
    backgroundColor: '#334155',
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  bannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#1D4ED8',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsContainerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  areaChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  areaChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  areaChipText: {
    fontSize: 12,
    color: '#475569',
  },
  areaChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  langChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  langChipText: {
    fontSize: 12,
    color: '#475569',
  },
  langChipTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  dayScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  dayChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  slotChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  slotChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  slotChipTextActive: {
    color: '#FFFFFF',
  },
  strictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  strictInfo: {
    flex: 1,
    paddingRight: 10,
  },
  strictTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  strictSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
