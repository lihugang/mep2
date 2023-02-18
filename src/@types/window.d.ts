import type { i18nMap } from '@/i18n';
import type { config } from '@/config';
declare global {
    interface Window {
        i18n: i18nMap,
        config: config
    }
}