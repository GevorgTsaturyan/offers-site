// Small fetch wrapper. Admin calls attach the stored JWT; a 401 logs out.
import { reactive } from 'vue';

export const auth = reactive({
  token: localStorage.getItem('admin_token') || '',
  username: localStorage.getItem('admin_user') || '',
});

export function setAuth(token, username) {
  auth.token = token; auth.username = username;
  if (token) { localStorage.setItem('admin_token', token); localStorage.setItem('admin_user', username); }
  else { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); }
}

export async function request(path, { method = 'GET', body, admin = false, form } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (admin && auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const res = await fetch(path, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && admin) setAuth('', '');
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
