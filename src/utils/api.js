import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://app.myhrnest.com';

export const api = async (path, method = 'GET', body = null) => {
  const token = await AsyncStorage.getItem('session_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Cookie'] = `session=${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    // Capture set-cookie header for login
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/session=([a-f0-9]+)/);
      if (match) await AsyncStorage.setItem('session_token', match[1]);
    }
    const data = await res.json();
    return data;
  } catch (e) {
    return { error: 'Network error. Please check your connection.' };
  }
};

export const logout = async () => {
  await api('/api/auth/logout', 'POST');
  await AsyncStorage.removeItem('session_token');
  await AsyncStorage.removeItem('user_data');
};

export const formatMMK = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString() + ' MMK';
};

export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
