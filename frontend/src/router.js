import { setCanonical } from './site.js';
import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './api.js';

const routes = [
  { path: '/', component: () => import('./views/HomeView.vue') },
  { path: '/offers/:slug', component: () => import('./views/OfferView.vue') },
  { path: '/confirm', component: () => import('./views/ConfirmView.vue') },
  { path: '/info/:page', component: () => import('./views/InfoView.vue') },
  {
    path: '/admin',
    component: () => import('./views/admin/AdminLayout.vue'),
    meta: { admin: true },
    children: [
      { path: '', redirect: '/admin/offers' },
      { path: 'offers', component: () => import('./views/admin/AdminOffers.vue') },
      { path: 'offers/new', component: () => import('./views/admin/AdminOfferEdit.vue') },
      { path: 'offers/:id', component: () => import('./views/admin/AdminOfferEdit.vue') },
      { path: 'settings', component: () => import('./views/admin/AdminSettings.vue') },
    ],
  },
  { path: '/admin/login', component: () => import('./views/admin/AdminLogin.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.matched.some(r => r.meta.admin) && !auth.token) return { path: '/admin/login', query: { next: to.fullPath } };
});

router.afterEach((to) => setCanonical(to.path));

export default router;
