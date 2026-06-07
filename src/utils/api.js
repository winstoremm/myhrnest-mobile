import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://app.myhrnest.com';

export const api = async (path, method = 'GET', body = null) => {
  const token = await AsyncStorage.getItem('session_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json();

    // On login, save the token returned in the JSON body
    if (data.token) {
      await AsyncStorage.setItem('session_token', data.token);
    }

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
