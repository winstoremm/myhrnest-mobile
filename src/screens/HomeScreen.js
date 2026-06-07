import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { api, logout, formatMMK } from '../utils/api';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

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

      const ciStatus = await api('/api/me/checkin');
      setCheckInStatus(ciStatus);
    } catch (e) {}
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    // Request GPS permission
    let gpsInfo = '';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        gpsInfo = `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`;
      }
    } catch (e) { /* GPS optional */ }

    const res = await api('/api/me/checkin', 'POST', gpsInfo ? { location: gpsInfo } : {});
    setCheckInLoading(false);
    if (res.ok) {
      const msg = res.action === 'checkin'
        ? `✅ Checked in at ${res.time}${gpsInfo ? `\n📍 ${gpsInfo}` : ''}`
        : `🏠 Checked out at ${res.time}`;
      Alert.alert('Attendance', msg);
      const updated = await api('/api/me/checkin');
      setCheckInStatus(updated);
    } else {
      Alert.alert('Attendance', res.message || res.error || 'Already completed for today.');
    }
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

      {/* Check-In / Check-Out Widget */}
      <CheckInWidget status={checkInStatus} onPress={handleCheckIn} loading={checkInLoading} />

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

function CheckInWidget({ status, onPress, loading }) {
  let btnColor = COLORS.green;
  let btnLabel = '🟢 Check In';
  let subText = "You haven't checked in yet today.";
  let cardBg = COLORS.successLight;

  if (status?.status === 'checked_in') {
    btnColor = '#D97706';
    btnLabel = '🏠 Check Out';
    subText = `Checked in at ${status.check_in}`;
    cardBg = COLORS.warningLight;
  } else if (status?.status === 'checked_out') {
    btnColor = COLORS.gray400;
    btnLabel = '✅ Done for Today';
    subText = `${status.check_in} → ${status.check_out}`;
    cardBg = '#F3F4F6';
  }

  return (
    <View style={[styles.ciCard, { backgroundColor: cardBg }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ciTitle}>Today's Attendance</Text>
        <Text style={styles.ciSub}>{subText}</Text>
      </View>
      <TouchableOpacity
        style={[styles.ciBtn, { backgroundColor: btnColor }]}
        onPress={onPress}
        disabled={loading || status?.status === 'checked_out'}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.ciBtnText}>{btnLabel}</Text>
        }
      </TouchableOpacity>
    </View>
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
  ciCard: {
    borderRadius: RADIUS.lg, padding: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.card,
  },
  ciTitle: { fontSize: 13, ...FONTS.bold, color: COLORS.navy, marginBottom: 3 },
  ciSub: { fontSize: 12, color: COLORS.gray600 },
  ciBtn: { borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: 16, minWidth: 120, alignItems: 'center' },
  ciBtnText: { color: '#fff', fontSize: 13, ...FONTS.bold },
});
