import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [VitePWA({
        registerType: 'prompt',
        workbox: {
            navigateFallback: 'index.html',
            runtimeCaching: [{
                urlPattern: /.*\.js$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'jsCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 200
                    }
                }
            }, {
                urlPattern: /.*\.css$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'cssCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 100
                    }
                }
            }, {
                urlPattern: /.*\.html$/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'htmlCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                }
            }, {
                urlPattern: /.*\.txt$/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'txtCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 20
                    }
                },
            }, {
                urlPattern: /.*\.pdf$/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'pdfCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 4
                    }
                },
            }, {
                urlPattern: /.*\.ttf$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'ttfCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 20
                    }
                }
            }, {
                urlPattern: /.*\.woff$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'woffCache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 20
                    }
                }
            }, {
                urlPattern: /.*\.woff2$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'woff2Cache',
                    cacheableResponse: {
                        statuses: [200]
                    },
                    expiration: {
                        maxEntries: 20
                    }
                }
            }, {
                urlPattern: /.*\.svg/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'svgCache',
                    cacheableResponse: {
                        statuses: [200]
                    }
                }
            }, {
                urlPattern: /.*\.png/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'pngCache',
                    cacheableResponse: {
                        statuses: [200]
                    }
                }
            }]
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
            name: 'The Math Editor For Photos 2',
            short_name: 'MEP2',
            description: 'Help you put LaTeX in your images',
            theme_color: '#87CEEB',
            icons: [
                {
                    src: 'favicon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: 'logo.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ],
            start_url: "/index.html",
            display: "fullscreen",
            background_color: "#87CEEB"
        },
    }), vue(), vueJsx()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        target: 'ES2015'
    }
});
