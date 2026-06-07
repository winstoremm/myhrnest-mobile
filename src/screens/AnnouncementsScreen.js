import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api } from '../utils/api';

const PRIORITY = {
  urgent:    { bg: '#FEE2E2', text: '#991B1B', label: '🚨 Urgent',    bar: '#DC2626' },
  important: { bg: '#FEF3C7', text: '#92400E', label: '⚠️ Important', bar: '#D97706' },
  normal:    { bg: '#DBEAFE', text: '#1E40AF', label: '🔵 Normal',    bar: '#3B82F6' },
};

export default function AnnouncementsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    const data = await api('/api/announcements');
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={items}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📢</Text>
          <Text style={styles.emptyText}>No announcements yet</Text>
          <Text style={styles.emptySub}>Check back later for company notices</Text>
        </View>
      }
      renderItem={({ item }) => {
        const p = PRIORITY[item.priority] || PRIORITY.normal;
        const isExpanded = expanded[item.id];
        const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return (
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: p.bar, borderLeftWidth: 4 }]}
            onPress={() => toggle(item.id)}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
              </View>
              <Text style={styles.date}>{dateStr}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {isExpanded && (
              <Text style={styles.body}>{item.body}</Text>
            )}
            <Text style={styles.expandHint}>{isExpanded ? '▲ Less' : '▼ Read more'}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, ...FONTS.bold, color: COLORS.navy, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.gray400, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 10,
    ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  priorityText: { fontSize: 11, ...FONTS.bold },
  date: { fontSize: 11, color: COLORS.gray400 },
  title: { fontSize: 15, ...FONTS.bold, color: COLORS.navy, marginBottom: 6 },
  body: { fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 8 },
  expandHint: { fontSize: 11, color: COLORS.navy, ...FONTS.semibold },
});
