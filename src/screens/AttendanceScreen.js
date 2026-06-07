import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api } from '../utils/api';

const STATUS_ICON = { present: '✅', absent: '❌', late: '⏰', halfday: '🔵', holiday: '🎉' };
const STATUS_COLOR = {
  present: { bg: '#D1FAE5', text: '#065F46' },
  absent: { bg: '#FEE2E2', text: '#991B1B' },
  late: { bg: '#FEF3C7', text: '#92400E' },
  halfday: { bg: '#DBEAFE', text: '#1E40AF' },
  holiday: { bg: '#F3E8FF', text: '#6B21A8' },
};
const STATUS_LABEL = { present: 'Present', absent: 'Absent', late: 'Late', halfday: 'Half Day', holiday: 'Holiday' };

export default function AttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, halfday: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const load = async (m = month) => {
    const data = await api(`/api/me/attendance?month=${m}`);
    const arr = Array.isArray(data) ? data : [];
    setRecords(arr);
    const s = { present: 0, absent: 0, late: 0, halfday: 0 };
    arr.forEach(r => { if (s[r.status] !== undefined) s[r.status]++; });
    setSummary(s);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const nm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setMonth(nm);
    setLoading(true);
    load(nm);
  };

  const monthLabel = () => {
    const [y, m] = month.split('-');
    return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
      data={records}
      keyExtractor={item => item.date}
      ListHeaderComponent={
        <>
          {/* Month Selector */}
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(-1)}>
              <Text style={styles.monthBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel()}</Text>
            <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.monthBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <SumCard label="Present" value={summary.present} color={COLORS.green} icon="✅" />
            <SumCard label="Absent" value={summary.absent} color={COLORS.danger} icon="❌" />
            <SumCard label="Late" value={summary.late} color={COLORS.warning} icon="⏰" />
            <SumCard label="Half Day" value={summary.halfday} color={COLORS.info} icon="🔵" />
          </View>

          <Text style={styles.sectionTitle}>Daily Records</Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>🕐</Text>
          <Text style={styles.emptyText}>No attendance records for this month</Text>
        </View>
      }
      renderItem={({ item }) => {
        const sc = STATUS_COLOR[item.status] || { bg: '#F3F4F6', text: '#374151' };
        const dayName = new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short' });
        const dayNum = new Date(item.date).getDate();
        return (
          <View style={styles.record}>
            <View style={styles.dayBox}>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dayNum}>{dayNum}</Text>
            </View>
            <View style={styles.recordMiddle}>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.text }]}>
                  {STATUS_ICON[item.status]} {STATUS_LABEL[item.status] || item.status}
                </Text>
              </View>
              {(item.check_in || item.check_out) && (
                <Text style={styles.timeText}>
                  {item.check_in || '—'} → {item.check_out || '—'}
                </Text>
              )}
            </View>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        );
      }}
    />
  );
}

function SumCard({ label, value, color, icon }) {
  return (
    <View style={[styles.sumCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.sumIcon}>{icon}</Text>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthBtn: { padding: 8, backgroundColor: '#fff', borderRadius: RADIUS.md, width: 40, alignItems: 'center', ...SHADOW.card },
  monthBtnText: { fontSize: 22, color: COLORS.navy, ...FONTS.bold },
  monthLabel: { fontSize: 16, ...FONTS.bold, color: COLORS.navy },
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 10, alignItems: 'center', ...SHADOW.card },
  sumIcon: { fontSize: 18, marginBottom: 4 },
  sumValue: { fontSize: 20, ...FONTS.black, marginBottom: 2 },
  sumLabel: { fontSize: 10, color: COLORS.gray400 },
  sectionTitle: { fontSize: 13, ...FONTS.bold, color: COLORS.navy, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  record: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.lg, padding: 14, marginBottom: 8, gap: 12, ...SHADOW.card,
  },
  dayBox: { width: 44, alignItems: 'center' },
  dayName: { fontSize: 11, color: COLORS.gray400, ...FONTS.medium },
  dayNum: { fontSize: 20, ...FONTS.black, color: COLORS.navy },
  recordMiddle: { flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 4 },
  statusText: { fontSize: 12, ...FONTS.bold },
  timeText: { fontSize: 12, color: COLORS.gray400 },
  notes: { fontSize: 11, color: COLORS.gray400, fontStyle: 'italic', flex: 1, textAlign: 'right' },
});
