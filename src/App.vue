<template>
    <template v-if="isConfigLoaded">
        <router-view :config="userConfig" :i18n="(i18nData.data as i18nMap)" />
    </template>
    <template v-else>
        Fetching user config......
</template>
</template>

<script lang="ts" setup>
import type { config } from '@/config';
import { ref, reactive } from 'vue';
import axios from '@/api/api.axios';
import type { getConfig } from '@/api/getConfig';
import i18n from '@/i18n';
import type { i18nMap } from '@/i18n';
const isConfigLoaded = ref(false);
const userConfig = reactive<config>({
    fontFamily: '',
    language: 'en-US',
    editor: {
        color: '',
        fontSize: 1,
        preferTextMode: 'auto'
    },
    snippets: [],
    experiments: {
        renderThreadPool: {
            enable: false,
            counts: 2
        }
    },
    update: {
        checkForUpdate: true,
        autoUpdate: true
    }
});

const i18nData = reactive<{
    data: null | i18nMap
}>({
    data: null
});

window.i18n = {} as i18nMap;
window.config = {} as config;

document.addEventListener('DOMContentLoaded', () => {
    const userLanguages: string[] = [];
    if (typeof navigator.languages === 'object' && navigator.languages instanceof Array) {
        navigator.languages.forEach(lang => userLanguages.push(lang));
    } else if (typeof navigator.language === 'string') userLanguages.push(navigator.language);
    else userLanguages.push('en-US');
    axios.get(`/config?default.languages=${userLanguages.join(',')}`).then((response: getConfig) => {
        if (!response.ok) throw response;
        userConfig.fontFamily = response.data.fontFamily;
        userConfig.language = response.data.language;
        userConfig.editor = response.data.editor;
        userConfig.experiments = response.data.experiments;
        userConfig.update = response.data.update;
        window.config = userConfig;
        // get config, load i18n components
        i18n(userConfig.language).then((value) => {
            i18nData.data = value;
            // i18n loaded, finished setup, load page
            isConfigLoaded.value = true;
            window.i18n = value;
        }).catch(err => {
            console.error(err);
            alert('Failed to load i18n map, please reload the page and try again.');
        });

        const { fontFamily } = response.data;
        if (fontFamily === 'Noto Sans Light') { // default fonts
            const NotoSansLight = new FontFace('Noto Sans Light', 'url("/fonts/NotoSans-Light.ttf")');
            const NotoSansLightAlias = new FontFace('Noto Sans Light--Remote', 'url("/fonts/NotoSans-Light.ttf")');
            document.fonts.add(NotoSansLight);
            document.fonts.add(NotoSansLightAlias);
            NotoSansLightAlias.load();
            NotoSansLight.load().then(() => {
                document.body.style.fontFamily = 'Noto Sans Light'; // set font family when it loaded
            });
        } else {
            document.body.style.fontFamily = fontFamily;
            // set the font family
        }
    }).catch((err: unknown) => {
        alert('Failed to get user config');
        console.error(err);
    });
});
// load fonts async, not block rendering
</script>
