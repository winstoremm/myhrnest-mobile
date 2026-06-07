import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api, logout, formatMMK } from '../utils/api';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_data');
      if (stored) setUser(JSON.parse(stored));

      const me = await api('/api/auth/me');
      if (!me.user) {
        handleLogout();
        return;
      }
      setUser(me.user);
      await AsyncStorage.setItem('user_data', JSON.stringify(me.user));

      const profileData = await api('/api/me/profile');
      setProfile(profileData);
    } catch (e) {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.navy} />
      </View>
    );
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {/* Employee Card */}
      {profile && (
        <View style={styles.empCard}>
          <View style={styles.empCardLeft}>
            <Text style={styles.empName}>{profile.name}</Text>
            <Text style={styles.empRole}>{profile.position || 'Employee'}</Text>
            <Text style={styles.empDept}>{profile.dept_name || '—'}</Text>
          </View>
          <View style={styles.empCardRight}>
            <Text style={styles.empId}>{profile.emp_id}</Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {profile.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickGrid}>
        <QuickBtn icon="👤" label="My Profile" color={COLORS.navy} onPress={() => navigation.navigate('Profile')} />
        <QuickBtn icon="💰" label="Payslips" color="#7B2D8B" onPress={() => navigation.navigate('Payslips')} />
        <QuickBtn icon="📅" label="My Leave" color={COLORS.green} onPress={() => navigation.navigate('Leave')} />
        <QuickBtn icon="🕐" label="Attendance" color="#D97706" onPress={() => navigation.navigate('Attendance')} />
      </View>

      {/* Info Row */}
      <Text style={styles.sectionTitle}>My Info</Text>
      <View style={styles.infoCard}>
        <InfoRow icon="📧" label="Email" value={profile?.email || '—'} />
        <InfoRow icon="📱" label="Phone" value={profile?.phone || '—'} />
        <InfoRow icon="📅" label="Joined" value={profile?.join_date || '—'} />
        <InfoRow icon="💼" label="Position" value={profile?.position || '—'} last />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
        ]);
      }}>
        <Text style={styles.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function QuickBtn({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, ...FONTS.bold, color: COLORS.navy },
  date: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, ...FONTS.bold },
  empCard: {
    backgroundColor: COLORS.navy, borderRadius: RADIUS.lg, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24,
    ...SHADOW.card,
  },
  empCardLeft: { flex: 1 },
  empName: { fontSize: 18, ...FONTS.bold, color: '#fff', marginBottom: 4 },
  empRole: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  empDept: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  empCardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  empId: { fontSize: 13, ...FONTS.bold, color: COLORS.greenLight },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  sectionTitle: { fontSize: 14, ...FONTS.bold, color: COLORS.navy, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickBtn: {
    width: '47%', borderRadius: RADIUS.lg, padding: 18, alignItems: 'center',
    ...SHADOW.card,
  },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { color: '#fff', fontSize: 13, ...FONTS.semibold },
  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, marginBottom: 24, overflow: 'hidden', ...SHADOW.card },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  infoIcon: { fontSize: 18, width: 28 },
  infoLabel: { fontSize: 11, color: COLORS.gray400, ...FONTS.medium },
  infoValue: { fontSize: 14, color: COLORS.gray900, ...FONTS.semibold, marginTop: 1 },
  logoutBtn: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center',
  },
  logoutText: { color: COLORS.danger, fontSize: 14, ...FONTS.semibold },
});
