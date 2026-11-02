// Per-host branding. One offers catalogue, served on the primary site (SITE_URL,
// indexed by search engines) and on per-sender-domain "brand hosts" such as
// offers.serawin.net, which email buttons link to so the link domain matches the
// From domain (deliverability). Brand hosts:
//   - override presentation settings (site_name, tagline, contact_email, …)
//   - are ALWAYS noindex (robots.txt Disallow, X-Robots-Tag, meta robots), so
//     they never compete with the primary site as duplicate content
//   - hide the newsletter box (visitors are already subscribers of that brand;
//     confirmations are sent by the primary site's identity)
//
// Config: BRAND_HOSTS env, JSON object keyed by hostname, e.g.
//   BRAND_HOSTS={"offers.serawin.net":{"site_name":"Serawin Offers","contact_email":"support@serawin.net"}}

const BRAND_KEYS = new Set(['site_name', 'tagline', 'hero_title', 'hero_subtitle', 'contact_email']);

export function primaryUrl() {
  return (process.env.SITE_URL || 'https://noradion.org').replace(/\/+$/, '');
}

export function brandHosts() {
  try {
    const raw = JSON.parse(process.env.BRAND_HOSTS || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    console.error('[brands] BRAND_HOSTS is not valid JSON — ignoring');
    return {};
  }
}

export function hostOf(req) {
  return String(req?.get?.('host') || '').toLowerCase().replace(/:\d+$/, '');
}

// { host, url, primary, overrides }
export function siteFor(req) {
  const host = hostOf(req);
  const brands = brandHosts();
  const b = brands[host];
  if (!b) return { host, url: primaryUrl(), primary: true, overrides: {} };
  const overrides = Object.fromEntries(Object.entries(b).filter(([k, v]) => BRAND_KEYS.has(k) && typeof v === 'string'));
  return { host, url: `https://${host}`, primary: false, overrides };
}
