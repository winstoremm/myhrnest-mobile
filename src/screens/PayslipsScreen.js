import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api, formatMMK } from '../utils/api';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayslipsScreen() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const data = await api('/api/me/payslips');
    setPayslips(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;

  if (!payslips.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>💰</Text>
        <Text style={styles.emptyText}>No payslips yet</Text>
        <Text style={styles.emptySub}>Your payslips will appear here after payroll processing</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        data={payslips}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListHeaderComponent={<Text style={styles.header}>My Payslips</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
            <View style={styles.cardLeft}>
              <Text style={styles.period}>{MONTHS[item.month]} {item.year}</Text>
              <Text style={styles.status}>
                {item.status === 'finalized' ? '✅ Finalized' : '📝 Draft'}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.netLabel}>Net Salary</Text>
              <Text style={styles.netAmount}>{formatMMK(item.net_salary)}</Text>
              <Text style={styles.viewMore}>View →</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Payslip Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payslip</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.payslipPeriod}>{MONTHS[selected.month]} {selected.year}</Text>

              <DetailSection title="EARNINGS">
                <DetailRow label="Basic Salary" value={formatMMK(selected.basic_salary)} />
                {selected.allowances > 0 && <DetailRow label="Allowances" value={formatMMK(selected.allowances)} />}
                {selected.bonus > 0 && <DetailRow label="Bonus" value={formatMMK(selected.bonus)} />}
                <DetailRow label="Gross Salary" value={formatMMK(selected.gross_salary)} bold />
              </DetailSection>

              <DetailSection title="DEDUCTIONS">
                <DetailRow label="Absent Deduction" value={`- ${formatMMK(selected.absent_deduction)}`} danger />
                {selected.loan_deduction > 0 && <DetailRow label="Loan Deduction" value={`- ${formatMMK(selected.loan_deduction)}`} danger />}
                {selected.other_deduction > 0 && <DetailRow label="Other Deduction" value={`- ${formatMMK(selected.other_deduction)}`} danger />}
                <DetailRow label="Total Deductions" value={`- ${formatMMK(selected.total_deduction)}`} bold danger />
              </DetailSection>

              <View style={styles.netBox}>
                <Text style={styles.netBoxLabel}>Net Salary</Text>
                <Text style={styles.netBoxAmount}>{formatMMK(selected.net_salary)}</Text>
              </View>

              <View style={styles.statsRow}>
                <StatBox label="Working Days" value={selected.working_days} />
                <StatBox label="Absent Days" value={selected.absent_days} danger />
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
}

function DetailSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value, bold, danger }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.bold, danger && { color: COLORS.danger }]}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value, danger }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statVal, danger && { color: COLORS.danger }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, ...FONTS.bold, color: COLORS.navy, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
  header: { fontSize: 20, ...FONTS.bold, color: COLORS.navy, marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, ...SHADOW.card,
  },
  cardLeft: { flex: 1 },
  period: { fontSize: 16, ...FONTS.bold, color: COLORS.navy, marginBottom: 6 },
  status: { fontSize: 12, color: COLORS.gray400 },
  cardRight: { alignItems: 'flex-end' },
  netLabel: { fontSize: 11, color: COLORS.gray400, marginBottom: 2 },
  netAmount: { fontSize: 15, ...FONTS.black, color: COLORS.green },
  viewMore: { fontSize: 12, color: COLORS.navy, marginTop: 4, ...FONTS.semibold },
  // Modal
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.navy,
  },
  modalTitle: { fontSize: 18, ...FONTS.bold, color: '#fff' },
  closeBtn: { padding: 4 },
  closeText: { color: '#fff', fontSize: 20 },
  modalBody: { padding: 20 },
  payslipPeriod: { fontSize: 22, ...FONTS.black, color: COLORS.navy, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, ...FONTS.bold, color: COLORS.gray400, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  detailLabel: { fontSize: 13, color: COLORS.gray600 },
  detailValue: { fontSize: 13, color: COLORS.gray900, ...FONTS.semibold },
  bold: { ...FONTS.bold, color: COLORS.navy },
  netBox: {
    backgroundColor: COLORS.navy, borderRadius: RADIUS.lg, padding: 20,
    alignItems: 'center', marginVertical: 16,
  },
  netBoxLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
  netBoxAmount: { fontSize: 24, ...FONTS.black, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
  },
  statVal: { fontSize: 24, ...FONTS.black, color: COLORS.navy, marginBottom: 4 },
  statLabel: { fontSize: 11, color: COLORS.gray400 },
});
