import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';
import { loadSite } from './site.js';
import './styles.css';

loadSite();
createApp(App).use(router).mount('#app');
