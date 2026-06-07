import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api } from '../utils/api';

const LEAVE_TYPES = [
  { value: 'annual', label: '🏖️ Annual Leave' },
  { value: 'sick', label: '🤒 Sick Leave' },
  { value: 'emergency', label: '🚨 Emergency Leave' },
  { value: 'maternity', label: '🤱 Maternity Leave' },
  { value: 'unpaid', label: '💸 Unpaid Leave' },
];

const typeLabel = (t) => LEAVE_TYPES.find(l => l.value === t)?.label || t;
const typeColor = { annual: '#DBEAFE', sick: '#FEE2E2', emergency: '#FEF3C7', maternity: '#FCE7F3', unpaid: '#F3F4F6' };
const typeText = { annual: '#1E40AF', sick: '#991B1B', emergency: '#92400E', maternity: '#9D174D', unpaid: '#374151' };
const statusColor = { pending: '#FEF3C7', approved: '#D1FAE5', rejected: '#FEE2E2' };
const statusText = { pending: '#92400E', approved: '#065F46', rejected: '#991B1B' };
const statusLabel = { pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected' };

export default function LeaveScreen() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Apply form state
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const load = async () => {
    const [data, bal] = await Promise.all([
      api('/api/me/leave'),
      api('/api/me/leave-balance'),
    ]);
    setLeaves(Array.isArray(data) ? data : []);
    setBalances(Array.isArray(bal) ? bal : []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) { Alert.alert('Missing', 'Please enter start and end dates (YYYY-MM-DD).'); return; }
    const days = calcDays();
    if (days < 1) { Alert.alert('Invalid', 'End date must be after start date.'); return; }
    setSaving(true);
    const res = await api('/api/me/leave', 'POST', {
      leave_type: leaveType, start_date: startDate, end_date: endDate, days, reason,
    });
    setSaving(false);
    if (res.ok) {
      Alert.alert('Submitted', 'Your leave request has been submitted for approval.');
      setShowModal(false);
      setStartDate(''); setEndDate(''); setReason(''); setLeaveType('annual');
      load();
    } else {
      Alert.alert('Error', res.error || 'Failed to submit leave.');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;

  return (
    <>
      <View style={styles.container}>
        {/* Filter tabs */}
        <View style={styles.filters}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <TouchableOpacity
              key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leave Balance Strip */}
        {balances.length > 0 && (
          <View style={styles.balanceStrip}>
            {balances.filter(b => b.entitled > 0 || b.leave_type === 'annual').slice(0,4).map(b => (
              <View key={b.leave_type} style={styles.balanceItem}>
                <Text style={styles.balVal}>{b.entitled - b.used}</Text>
                <Text style={styles.balLabel}>{b.leave_type.charAt(0).toUpperCase() + b.leave_type.slice(1)}</Text>
                <Text style={styles.balSub}>{b.used}/{b.entitled}</Text>
              </View>
            ))}
          </View>
        )}

        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} leave requests</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor[item.leave_type] || '#f3f4f6' }]}>
                  <Text style={[styles.typeText, { color: typeText[item.leave_type] || '#374151' }]}>{typeLabel(item.leave_type)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor[item.status] }]}>
                  <Text style={[styles.statusText, { color: statusText[item.status] }]}>{statusLabel[item.status]}</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>📆 {item.start_date} → {item.end_date}</Text>
                <Text style={styles.daysText}>{item.days} day{item.days > 1 ? 's' : ''}</Text>
              </View>
              {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
            </View>
          )}
        />

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
          <Text style={styles.fabText}>+ Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Apply Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Leave</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ color: '#fff', fontSize: 22 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>Leave Type</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
                <Text style={styles.selectorText}>{typeLabel(leaveType)}</Text>
                <Text style={{ color: COLORS.gray400 }}>▼</Text>
              </TouchableOpacity>
              {showTypeDropdown && (
                <View style={styles.dropdown}>
                  {LEAVE_TYPES.map(t => (
                    <TouchableOpacity key={t.value} style={styles.dropdownItem}
                      onPress={() => { setLeaveType(t.value); setShowTypeDropdown(false); }}>
                      <Text style={styles.dropdownText}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dateFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={startDate}
                  onChangeText={setStartDate} keyboardType="numeric" maxLength={10} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>End Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={endDate}
                  onChangeText={setEndDate} keyboardType="numeric" maxLength={10} />
              </View>
            </View>

            {calcDays() > 0 && (
              <View style={styles.daysPreview}>
                <Text style={styles.daysPreviewText}>{calcDays()} day{calcDays() > 1 ? 's' : ''} of leave</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Reason (optional)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Brief reason for leave..."
                value={reason}
                onChangeText={setReason}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit} disabled={saving}
            >
              <Text style={styles.submitText}>{saving ? 'Submitting...' : 'Submit Leave Request'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  filters: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.gray200 },
  filterTabActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { fontSize: 12, ...FONTS.semibold, color: COLORS.gray600 },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: COLORS.gray400 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 10, ...SHADOW.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  typeText: { fontSize: 12, ...FONTS.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, ...FONTS.bold },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 13, color: COLORS.gray600 },
  daysText: { fontSize: 13, ...FONTS.bold, color: COLORS.navy },
  reason: { fontSize: 12, color: COLORS.gray400, marginTop: 8, fontStyle: 'italic' },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: COLORS.navy, borderRadius: RADIUS.full,
    paddingVertical: 14, paddingHorizontal: 24, ...SHADOW.card,
  },
  fabText: { color: '#fff', ...FONTS.bold, fontSize: 14 },
  // Modal
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.navy,
  },
  modalTitle: { fontSize: 18, ...FONTS.bold, color: '#fff' },
  field: { marginBottom: 16 },
  label: { fontSize: 12, ...FONTS.bold, color: COLORS.gray600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    padding: 12, fontSize: 14, color: COLORS.gray900, backgroundColor: '#FAFAFA',
  },
  selector: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    padding: 12, backgroundColor: '#FAFAFA', flexDirection: 'row', justifyContent: 'space-between',
  },
  selectorText: { fontSize: 14, color: COLORS.gray900 },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 4,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  dropdownText: { fontSize: 14, color: COLORS.gray900 },
  dateFields: { flexDirection: 'row', gap: 12 },
  daysPreview: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: 10, marginBottom: 16, alignItems: 'center',
  },
  daysPreviewText: { color: COLORS.info, ...FONTS.bold, fontSize: 14 },
  submitBtn: { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, padding: 15, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 15, ...FONTS.bold },
  balanceStrip: {
    flexDirection: 'row', backgroundColor: COLORS.navy,
    paddingVertical: 10, paddingHorizontal: 16, gap: 8,
  },
  balanceItem: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md, paddingVertical: 8,
  },
  balVal: { fontSize: 20, ...FONTS.black, color: '#fff' },
  balLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', ...FONTS.semibold, marginTop: 1 },
  balSub: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
});
