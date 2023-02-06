/* eslint-disable indent */
// I don't know why eslint indent goes wrong with switch statement
import type { config } from '@/config';
type i18nMap = (typeof import('./en-US'))['default'];
export type { i18nMap };
export default (language: config['language']): Promise<i18nMap> => {
    // return import(`./${language}`);
    // do not use string template & dynamic import, the return type will be inferred as any
    // use switch instead
    switch (language) {
        case 'en-US': return import('./en-US').then(data => data.default);
        case 'zh-CN': return import('./zh-CN').then(data => data.default);
        default:
            alert('Sorry, this page cannot be afforded in your language.');
            return import('./en-US').then(data => data.default);
    }
};
