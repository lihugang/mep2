<template>
    Experiment Feature - Render Thread
    <div ref="container"></div>
</template>
<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import html2canvas, { Options } from 'html2canvas';
import 'katex/dist/katex.css';
const container = ref<HTMLDivElement>();

window.addEventListener('message', (event: MessageEvent<{
    content: string;
    size: string;
    color: string;
    font: string;
    options?: Partial<Options>;
    target: string;
    id: string;
    width?: number;
    height?: number;
}>) => {
    if (event.data.target !== 'thread') return;
    if (container.value) {
        container.value.innerHTML = event.data.content;
        container.value.style.position = 'fixed';
        container.value.style.top = '0%';
        container.value.style.left = '0%';
        container.value.style.display = 'block';
        container.value.style.fontSize = event.data.size;
        container.value.style.color = event.data.color;
        container.value.style.fontFamily = event.data.font;
        container.value.style.width = (event.data.width ?? window.innerWidth) + 'px';
        // container.value.style.height = (event.data.height ?? window.innerHeight) + 'px';

        nextTick(() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            html2canvas(container.value!, event.data.options).then(canvas => canvas.toDataURL('image/png')).then(dataurl => {
                console.log('Send', dataurl);
                window.opener?.postMessage({
                    data: dataurl,
                    target: 'main',
                    id: event.data.id
                });
            }).catch(err => {
                console.error(err);
                alert(err);
                window.opener?.postMessage({
                    data: 'data,',
                    target: 'main',
                    id: event.data.id
                });
            });
        });
    }
});
</script>
