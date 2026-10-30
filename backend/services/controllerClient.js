// Talks to the campaign-manager controller's double opt-in API
// (POST /api/public/subscribe, /api/public/confirm). The site key never
// reaches the browser — only this backend knows it.

function cfg() {
  return {
    url: (process.env.CONTROLLER_URL || '').replace(/\/+$/, ''),
    key: process.env.CONTROLLER_SITE_KEY || '',
  };
}

export function isConfigured() {
  const { url, key } = cfg();
  return Boolean(url && key);
}

async function post(path, body, fetchImpl = fetch) {
  const { url, key } = cfg();
  const res = await fetchImpl(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Site-Key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `controller HTTP ${res.status}`), { status: res.status });
  return data;
}

export const subscribe = (payload, fetchImpl) => post('/api/public/subscribe', payload, fetchImpl);
export const confirm   = (token, fetchImpl)   => post('/api/public/confirm', { token }, fetchImpl);
