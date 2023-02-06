<template>
    <div class="mask"></div>
    <div class="container">
        <div class="text">
            {{ props.i18n.save }} <br /> <br />
            {{ props.i18n.author }}: <input type="text" maxlength="64" v-model="author" /><br />
            {{ props.i18n.compressed }}: <input type="checkbox" v-model="compressed" /> <br />
            {{ props.i18n.keep_cache }}: <input type="checkbox" v-model="keepCache" /><br />
            {{ props.i18n.embed_fonts }}: <input type="checkbox" v-model="embedFonts" /><br />
        </div>
        <div class="button-container">
            <span class="button" @click="cancel">{{ props.i18n.cancel }}</span>
            <span style="user-select: none">&thinsp;&thinsp;</span>
            <span class="button" @click="confirm">{{ props.i18n.confirm }}</span>
            <span style="user-select: none">&thinsp;&thinsp;</span>
        </div>
    </div>
</template>
<style scoped>
.mask {
    position: fixed;
    top: 0%;
    left: 0%;
    height: 100%;
    width: 100%;
    backdrop-filter: blur(4px) brightness(75%);
}

.container {
    position: fixed;
    top: 30%;
    left: 30%;
    height: 30%;
    min-height: 300px;
    width: 40%;
    min-width: 240px;
    border: 2px solid snow;
    border-radius: 8px;
    padding: 10px 30px;
    font-size: 1.2em;
    background-color: whitesmoke;
}

.text {
    user-select: none;
}

.button-container {
    position: absolute;
    bottom: 4px;
    right: 2px;
}

.button {
    position: relative;
    bottom: 4px;
    color: snow;
    background-color: rgb(128, 187, 205);
    padding: 4px 12px;
    cursor: pointer;
    user-select: none;
}

.button:hover {
    background-color: rgb(98, 157, 175);
}

input[type=checkbox] {
    font-size: 16px;
    line-height: 20px;
}
</style>
<script lang="ts" setup>
import { defineProps, defineExpose, ref } from 'vue';
import type { i18nMap } from '@/i18n';
import getIsElectron from '@/api/isElectron';
const props = defineProps<{
    i18n: i18nMap
}>();
const onUserConfirm = ref<(author: string, compressed: boolean, keepCache: boolean, embedFonts: boolean) => void>();
const onUserCancel = ref<() => void>();
defineExpose({
    onUserConfirm,
    onUserCancel
});

const cancel = () => {
    onUserCancel.value && onUserCancel.value();
};

const confirm = () => {
    onUserConfirm.value && onUserConfirm.value(author.value, compressed.value, keepCache.value, embedFonts.value);
};

const isElectron = ref(false);
getIsElectron.then(_isElectron => {
    isElectron.value = _isElectron;
});

const author = ref('');
const compressed = ref(true);
const keepCache = ref(true);
const embedFonts = ref(true);
</script>
