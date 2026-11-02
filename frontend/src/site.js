// Site settings (name, tagline, …) loaded once and shared by every page.
import { reactive } from 'vue';
import { request } from './api.js';

export const site = reactive({
  loaded: false,
  site_name: 'Casino Offers',
  tagline: '',
  hero_title: '',
  hero_subtitle: '',
  contact_email: '',
  min_age: '18',
  responsible_gambling_url: 'https://www.begambleaware.org',
});

export async function loadSite() {
  try {
    Object.assign(site, await request('/api/site'), { loaded: true });
  } catch { site.loaded = true; }
}

export function setTitle(part) {
  document.title = part ? `${part} · ${site.site_name}` : `${site.site_name} — ${site.tagline || 'Casino offers'}`;
}

// Keep <link rel="canonical"> in sync on client-side navigation (server sets it on first load).
export function setCanonical(path) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = 'https://noradion.org' + path;
}
