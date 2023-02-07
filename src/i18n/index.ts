import type { config } from '@/config';
export type i18nMapArgument = {
    [key: string]: string | number
}
export type i18nMapSource = typeof import('./en-US')['default'] | typeof import('./zh-CN')['default'];
export type i18nMap = i18nMapSource & {
    template: (key: keyof i18nMapSource, arg: i18nMapArgument) => string
};
export default (language: config['language']): Promise<i18nMap> => {
    const src = (() => {
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
    })();
    return src.then(map => {
        return {
            ...map,
            template(key, arg) {
                let sourceString = map[key];
                const templateMatchRegExp = /\[\[.+?\]\]/g;
                const templates = Array.from(sourceString.matchAll(templateMatchRegExp));
                templates.forEach(match => {
                    const src = match[0].slice(2, -2).trim();
                    if (arg[src]) {
                        sourceString = sourceString.replace(match[0], arg[src].toString());
                    } else return;
                });
                return sourceString;
            },
        };
    });
};
