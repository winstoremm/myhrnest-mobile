import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar, ScrollView,
} from 'react-native';
import { COLORS, FONTS, RADIUS } from '../utils/theme';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error);
    } else {
      navigation.replace('Main');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>MyHR</Text>
            <Text style={styles.logoNest}>Nest</Text>
          </View>
          <Text style={styles.tagline}>HR & People Management</Text>
          <Text style={styles.subtitle}>Employee Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Access your HR portal</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0 }]}
                placeholder="Enter password"
                placeholderTextColor={COLORS.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In →</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 MyHR Nest · Powered by Win Central</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  logoText: { fontSize: 38, ...FONTS.black, color: '#fff', letterSpacing: -1 },
  logoNest: { fontSize: 38, ...FONTS.black, color: '#4CAF50', letterSpacing: -1 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 13, ...FONTS.medium, letterSpacing: 0.5 },
  subtitle: {
    marginTop: 6, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
    color: '#fff', fontSize: 12, ...FONTS.semibold,
  },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.navy, marginBottom: 4 },
  cardSub: { fontSize: 13, color: COLORS.gray400, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, ...FONTS.semibold, color: COLORS.gray600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    padding: 12, fontSize: 14, color: COLORS.gray900, backgroundColor: '#FAFAFA',
  },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    backgroundColor: '#FAFAFA', overflow: 'hidden', paddingLeft: 12,
  },
  eyeBtn: { padding: 12 },
  eyeText: { fontSize: 16 },
  loginBtn: {
    backgroundColor: COLORS.navy, borderRadius: RADIUS.md, padding: 15,
    alignItems: 'center', marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 15, ...FONTS.bold },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 28 },
});
