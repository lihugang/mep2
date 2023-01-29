<template>
    <div class="mask"></div>
    <div class="container">
        <div class="text">
            {{ props.i18n.render_type }}: <template v-if="options.isRenderAllPages">{{
                props.i18n.all_pages
            }}</template><template v-else>{{ props.i18n.single_page }}</template>
            <br />
            {{ props.i18n.export_type }}: <template v-if="options.isExportImages">.png</template><template
                v-else>.pdf</template>
            <br />
            {{ props.i18n.watermark }}: <input type="checkbox" v-model="isUseWatermark" :disabled="!isElectron" :title="
            isElectron ? '' : props.i18n.use_app_side_to_remove_watermark
            "/>
            <!-- In Web platform, all render will be added watermarks, to make user use app platform -->
            <hr />
            {{ props.i18n.progress }}: {{ progress }}%
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
    text-align: center;
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
import { defineProps, defineExpose, reactive, ref } from 'vue';
import { i18nMap } from '@/i18n';
import getIsElectron from '@/api/isElectron';
const props = defineProps<{
    i18n: i18nMap
}>();
const options = reactive({
    isRenderAllPages: true,
    isExportImages: false
});
const onUserConfirm = ref<(useWatermark: boolean, onProgress: (progress: number) => void) => void>();
const onUserCancel = ref<() => void>();
defineExpose({
    options,
    onUserConfirm,
    onUserCancel
});

const cancel = () => {
    onUserCancel.value && onUserCancel.value();
};

const confirm = () => {
    onUserConfirm.value && onUserConfirm.value(
        isUseWatermark.value,
        (_progress: number) => {
            progress.value = _progress;
        }
    );
};

const progress = ref(0);
const isElectron = ref(false);
getIsElectron.then(_isElectron => {
    isElectron.value = _isElectron;
});

const isUseWatermark = ref(true);
</script>
