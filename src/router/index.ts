import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/main-page.vue')
    },
    {
        path: '/editor',
        name: 'editor',
        component: () => import('@/views/editor-page.vue')
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/views/settings-page.vue')
    },
    {
        path: '/about',
        name: 'about',
        component: () => import('@/views/about-page.vue')
    },
    {
        path: '/experiments/renderThread',
        name: 'exp/render-thread',
        component: () => import('@/views/html2canvas-thread.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;
