import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './monaco-editor-env';

createApp(App).use(router).mount('#app');
