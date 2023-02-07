<template>
    <div class="status-bar">
        <span class="platform">
            {{ showPlatform }}
        </span>
        &nbsp;&nbsp;
        <span class="task-status" :style="props.statusStyle">
            {{ props.status }}
        </span>
        &nbsp;
        <span class="time">
            {{ time }}
        </span>
    </div>
</template>
<style scoped>
.status-bar {
    position: absolute;
    bottom: 0%;
    left: 0%;
    width: 100%;
    height: 20px;
    user-select: none;
    font-size: 14px;
    line-height: 18px;
    border-top: 2px solid rgb(0, 122, 204);
    background-color: rgb(0, 102, 184);
    color: snow;
    border-radius: 4px;
}

.platform {
    font-size: 14px;
    line-height: 18px;
    padding: 0px 4px;
    color: rgb(146, 187, 104);
}

.time {
    float: right;
}
</style>
<script lang="ts" setup>
import { defineProps, ref, defineExpose } from 'vue';
import type { CSSProperties } from 'vue';
import bowser from 'bowser';
import isElectronPromise from '@/api/isElectron';
import getVersion from '@/api/getVersion';
import type { i18nMap } from '@/i18n';

const props = defineProps<{
    i18n: i18nMap,
    status: string,
    statusStyle: CSSProperties
}>();

const showPlatform = ref(''); // display the platform the user uses
Promise.all([isElectronPromise, getVersion.localVersion]).then((result: [boolean, [number, number, number]]) => {
    // get platform and version
    const isElectron = result[0];
    const version = result[1];
    const browserUA = bowser.parse(window.navigator.userAgent);
    showPlatform.value = `MEP ${isElectron ? props.i18n.app_platform : props.i18n.web_platform} ${version.join('.')} ${browserUA.os.name} ${browserUA.os.versionName} ${browserUA.browser.name} ${parseInt(browserUA.browser.version || '0')}`;
});

const time = ref(''); // display current time
const updateTime = () => {
    time.value = new Date(
        new Date().getTime() - (new Date().getTimezoneOffset()) * 1000 * 60 // times second(60) and ms(1000)
        // process timezone
    ).toISOString().slice(0, -1);
    // display local time, not iso time, remove zero flag
    requestAnimationFrame(updateTime);
};
updateTime();

defineExpose({
    time,
    showPlatform
});
</script>
