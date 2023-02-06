<template>
    <div class="home">
        <top-bar></top-bar>
        <view>
            <div class="container">
                <div class="container-title">
                    MEP {{ props.i18n.about_us }}
                </div>
                <div class="menu-list">
                    <ul>
                        <li>
                            <router-link to="/" class="button">{{ props.i18n.back }}</router-link>
                        </li>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                    </ul>
                </div>
                <div class="about-container" :style="{
                    height: innerHeight - 200 + 'px'
                }">
                    MEP Version 2.1.0 <img height="32" width="32" src="/logo.png" title="logo">
                    <br />
                    Release Time: 02-06-2023 <br />
                    Official website: <a href="https://mep2.deta.dev">mep2.deta.dev</a> <br />
                    GitHub: <a href="https://github.com/lihugang/mep2">https://github.com/lihugang/mep2</a> <br />
                    License: <a href="/gpl-3.0.pdf" target="_blank">GPL 3.0</a> <br />
                    Contributor: <a href="https://github.com/lihugang">lihugang</a> <br />
                    Sponsor: none <br />
                    <hr />
                    Here are the fonts and libraries we use, thank their developer. <br />
                    Fonts: <ul>
                        <li>
                            <a href="/fonts.google.noto.sans.light.license.txt" target="_blank">Noto Sans Light</a>
                            &nbsp; SIL OPEN FONT LICENSE Version 1.1 &nbsp; <a href="https://fonts.google.com"
                                target="_blank">fonts.google.com</a>
                        </li>
                    </ul>
                    <br />
                    Dependicies: <ul>
                        <li>
                            <a href="/axios.license.txt" target="_blank">Axios</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://axios-http.com/"
                                target="_blank">axios-http.com</a>
                        </li>
                        <li>
                            <a href="/bodyparser.license.txt" target="_blank">Body Parser</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/expressjs/body-parser"
                                target="_blank">github.com/expressjs/body-parser</a>
                        </li>
                        <li>
                            <a href="/bowser.license.txt" target="_blank">Bowser</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/lancedikson/bowser"
                                target="_blank">github.com/lancedikson/bowser</a>
                        </li>
                        <li>
                            <a href="/corejs.license.txt" target="_blank">Core-js</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/zloirock/core-js"
                                target="_blank">github.com/zloirock/core-js</a>
                        </li>
                        <li>
                            <a href="/express.license.txt" target="_blank">Express</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://expressjs.com" target="_blank">expressjs.com</a>
                        </li>
                        <li>
                            <a href="/html2canvas.license.txt" target="_blank">html2canvas</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://html2canvas.hertzen.com/"
                                target="_blank">html2canvas.hertzen.com</a>
                        </li>
                        <li>
                            <a href="/katex.license.txt" target="_blank">KaTeX</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://katex.org/" target="_blank">katex.org</a>
                        </li>
                        <li>
                            <a href="/lodash.license.txt" target="_blank">LoDash</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://lodash.com/" target="_blank">lodash.com</a>
                        </li>
                        <li>
                            <a href="/monaco.license.txt" target="_blank">Monaco-Editor</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/microsoft/monaco-editor"
                                target="_blank">github.com/microsoft/monaco-editor</a>
                        </li>
                        <li>
                            <a href="/pako.license.txt" target="_blank">Pako</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/nodeca/pako"
                                target="_blank">github.com/nodeca/pako</a>
                        </li>
                        <li>
                            <a href="/pdflib.license.txt" target="_blank">Pdf-Lib</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://pdf-lib.js.org/"
                                target="_blank">pdf-lib.js.org</a>
                        </li>
                        <li>
                            sha256
                            &nbsp; UNKNOWN &nbsp; <a href="https://github.com/cryptocoinjs/sha256"
                                target="_blank">github.com/cryptocoinjs/sha256</a>
                        </li>
                        <li>
                            <a href="/vuejs.license.txt" target="_blank">Vue.js</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://vuejs.org" target="_blank">vuejs.org</a>
                        </li>
                        <li>
                            <a href="/vue-router.license.txt" target="_blank">Vue Router</a>
                            &nbsp; MIT LICENSE &nbsp; <a href="https://github.com/vuejs/router"
                                target="_blank">github.com/vuejs/router</a>
                        </li>
                    </ul>
                </div>
            </div>
        </view>
        <bottom-bar></bottom-bar>
    </div>
</template>
<style scoped>
view {
    position: fixed;
    top: 72px;
    height: calc(100% - 72px - 18px);
    width: 100%;
}

.container-title {
    width: 100%;
    text-align: center;
    font-size: 36px;
    line-height: 48px;
    user-select: none;
}

.about-container {
    user-select: none;
    font-size: 1.2em;
    overflow: scroll;
}

.menu-list ul {
    display: block;
    width: 100%;
    text-align: center;
    user-select: none;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 2px solid rgb(200, 200, 200);
    padding: 6px 14px;
    border-radius: 8px;
    padding-inline-start: 0px;
    margin-block-start: 0px;
    /* cover user-agent */
}

.menu-list li {
    display: inline;
    font-size: 24px;
    line-height: 30px;
}

.menu-list li .button {
    text-decoration: none;
}

.button {
    color: rgb(40, 40, 40);
    cursor: pointer;
}

.button:hover {
    background-color: rgb(200, 200, 200);
}
</style>
<script lang="ts" setup>
import { defineProps } from 'vue';
import topBar from '@/components/top-bar.vue';
import bottomBar from '@/components/bottom-bar.vue';

import type { i18nMap } from '@/i18n';

const props = defineProps<{
    i18n: i18nMap
}>();

const innerHeight = window.innerHeight;
</script>
