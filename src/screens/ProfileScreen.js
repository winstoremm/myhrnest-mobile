import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api, formatDate } from '../utils/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await api('/api/me/profile');
    setProfile(data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
    >
      {/* Avatar Header */}
      <View style={styles.avatarHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile?.name?.charAt(0).toUpperCase() || 'E'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.pos}>{profile?.position || 'Employee'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{(profile?.status || 'active').toUpperCase()}</Text>
        </View>
      </View>

      {/* Personal Info */}
      <SectionCard title="👤 Personal Information">
        <Row label="Employee ID" value={profile?.emp_id} />
        <Row label="Full Name" value={profile?.name} />
        <Row label="Email" value={profile?.email} />
        <Row label="Phone" value={profile?.phone} last />
      </SectionCard>

      {/* Work Info */}
      <SectionCard title="💼 Employment Details">
        <Row label="Department" value={profile?.dept_name} />
        <Row label="Position" value={profile?.position} />
        <Row label="Date Joined" value={profile?.join_date} />
        <Row label="Employment Type" value={profile?.employment_type || '—'} last />
      </SectionCard>

      {/* Address */}
      {profile?.address && (
        <SectionCard title="📍 Address">
          <Row label="Address" value={profile.address} last />
        </SectionCard>
      )}
    </ScrollView>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  avatarHeader: {
    alignItems: 'center', backgroundColor: COLORS.navy,
    borderRadius: RADIUS.xl, padding: 28, marginBottom: 16, ...SHADOW.card,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, ...FONTS.bold, color: '#fff' },
  name: { fontSize: 20, ...FONTS.bold, color: '#fff', marginBottom: 4 },
  pos: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  statusBadge: {
    backgroundColor: COLORS.greenLight, paddingHorizontal: 14,
    paddingVertical: 4, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 11, ...FONTS.bold, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.card },
  cardTitle: { fontSize: 13, ...FONTS.bold, color: COLORS.navy, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  row: { paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  rowLabel: { fontSize: 11, color: COLORS.gray400, ...FONTS.medium, marginBottom: 2 },
  rowValue: { fontSize: 14, color: COLORS.gray900, ...FONTS.semibold },
});
