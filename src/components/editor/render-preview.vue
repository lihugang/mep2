<template>
    <div class="render-preview" ref="renderPreviewRef">
        <div class="compile-error" v-show="display.type === 'compile-error'">
            <div v-html="display.error?.replaceAll('\n', '<br />')"></div>
        </div>
        <div class="preview-color" v-show="display.type === 'render-color'" :color="display.color">
            <canvas class="render-color-canvas" ref="renderColorCanvasRef"></canvas>
        </div>
        <div class="preview-font-size" v-show="display.type === 'render-font-size'" :style="{
            fontSize: ((display.size ?? 14) / (display.canvasHeight ?? 2304) * (renderPreviewRef?.offsetHeight ?? 200)) + 'px'
        }" :size="display.size" :real-height="display.canvasHeight" :container-height="renderPreviewRef?.offsetHeight">
            {{ props.i18n.font_size }}: {{ display.size }}px
        </div>
        <div class="preview-font-family" v-show="display.type === 'render-font-family'" :style="{
            fontFamily: display.fontFamily || 'Noto Sans Light'
        }">
            {{ props.i18n.font_family }}: {{ display.fontFamily }}
        </div>
        <div class="LaTeX-preview" v-show="display.type === 'render-LaTeX'" :LaTeX="display.LaTeX">
            <div :style="{
                maxHeight: (renderPreviewRef?.offsetHeight ?? 200) + 'px',
                maxWidth: (renderPreviewRef?.offsetWidth ?? 200) + 'px',
                overflowX: 'auto',
                overflowY: 'auto'
            }">
                <template v-for="item in (display.LaTeX || '').split('\\\\')" :key="item">
                    <div v-html="katex.renderToString(item || '', {
                        strict: 'ignore',
                        throwOnError: false,
                        macros: display.macros || {}
                    })"></div>
                </template>
            </div>
        </div>
        <div class="image-preview" v-show="display.type === 'preview-image'" :style="{
            height: props.height,
            width: props.width
        }">
            <img :src="display.dataurl ?? ''" />
        </div>
    </div>
</template>
<style scoped>
.compile-error {
    font-size: 16px;
    line-height: 20px;
    color: red;
}

img {
    max-height: 50%;
    max-width: 50%;
}
</style>
<script lang="ts" setup>
import { reactive, defineExpose, ref, watch, defineProps } from 'vue';

import type { i18nMap } from '@/i18n';

import katex from 'katex';
import 'katex/dist/katex.css';
interface displayT {
    type: 'none' | 'compile-error' | 'render-color' | 'render-font-size' | 'render-font-family' | 'render-LaTeX' | 'preview-image';
    error?: string;
    color?: string;
    size?: number;
    fontFamily?: string;
    LaTeX?: string;
    canvasHeight?: number;
    macros?: {
        [key: string]: string
    },
    dataurl?: string;
}
const display = reactive<displayT>({
    type: 'none'
});

const renderPreviewRef = ref<HTMLElement>();

defineExpose({
    display
});
const renderColorCanvasRef = ref<HTMLCanvasElement>();
watch(renderColorCanvasRef, () => {
    if (renderColorCanvasRef.value && renderPreviewRef.value) {
        renderColorCanvasRef.value.height = renderPreviewRef.value.offsetHeight - 8;
        renderColorCanvasRef.value.width = renderPreviewRef.value.offsetWidth;
    }
});
watch(display, () => {
    if (display.type === 'render-color' && renderColorCanvasRef.value && renderPreviewRef.value) {
        const color = display.color as string;
        const ctx = renderColorCanvasRef.value.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, renderPreviewRef.value.offsetWidth, renderPreviewRef.value.offsetHeight);
            ctx.fillStyle = 'snow';
            ctx.fillRect(0, 0, 80, 30);
            ctx.fillStyle = 'red';
            ctx.font = '16px "Noto Sans Light"';
            ctx.fillText(color, 10, 20);
        }
    }
});

const props = defineProps<{
    height: string;
    width: string;
    i18n: i18nMap
}>();
</script>
