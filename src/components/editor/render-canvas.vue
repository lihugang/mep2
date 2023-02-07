<template>
    <div class="render-canvas">
        <canvas ref="canvasRef" @click="onCanvasClick($event)" @mousedown="startDraw($event)" @mousemove="draw($event)"
            @mouseup="endDraw"></canvas>
    </div>
</template>
<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineProps, watch, ref, reactive, defineEmits } from 'vue';
import type { Project } from '@/utils/ProjectManager';
import { CodeKeyWord } from '@/utils/AST/AST.type';
import katex from 'katex';
import 'katex/dist/katex.css';
import calcSha256 from 'sha256';
// eslint-disable-next-line camelcase
import type { Options as h2c_Options } from 'html2canvas';

import type { i18nMap } from '@/i18n';

const props = defineProps<{
    project: Project,
    currentPage: number,
    width: number,
    height: number,
    mode: 'normal' | 'insert-text' | 'draw',
    platform: string,
    i18n: i18nMap,
    // eslint-disable-next-line camelcase, func-call-spacing
    renderText: (element: HTMLElement, options?: Partial<h2c_Options> | undefined, width?: number) => Promise<string>
}>();

const emits = defineEmits(['insertStatement']);

type timestamp = number;
const renderRecord: timestamp[] = [];

const canvasRef = ref<HTMLCanvasElement>();

const imageElementMap = new Map<string, InstanceType<typeof Image>>();
let isCouldRunHtml2canvas = true;

const isDrawStart = ref(false);

const pageSize = reactive({
    height: -1,
    width: -1
});

watch(canvasRef, () => {
    if (canvasRef.value) {
        canvasRef.value.height = props.height;
        canvasRef.value.width = props.width;
        window.addEventListener('resize', () => {
            setTimeout(() => {
                canvasRef.value!.height = props.height;
                canvasRef.value!.width = props.width;
            }, 500);
        }); // re layout
        const ctx = canvasRef.value.getContext('2d')!;

        watch([pageSize, props], () => {
            // re layout
            canvasRef.value!.height = props.height;
            canvasRef.value!.width = props.width;
        });

        const render = () => {
            const currentTime = new Date().getTime();
            while ((currentTime - renderRecord[0]) > 1000) { // over 1s, clear it
                renderRecord.shift();
            }
            renderRecord.push(currentTime);

            const currentPage = props.project.pages[props.currentPage - 1];
            let isError = false;

            ctx.clearRect(0, 0, props.width, props.height);
            ctx.fillStyle = '#000000';

            const AST = currentPage.AST;
            try {
                if (AST[0].type === CodeKeyWord.SET && AST[0].key === CodeKeyWord.CANVAS) {
                    if (pageSize.height !== AST[0].height) {
                        pageSize.height = AST[0].height;
                    }
                    if (pageSize.width !== AST[0].width) {
                        pageSize.width = AST[0].width;
                    }
                } else throw new Error(props.i18n.could_not_find_set_canvas);
            } catch {
                ctx.font = '16px "Noto Sans Light"';
                ctx.fillStyle = '#ff0000';
                ctx.fillText(`${props.i18n.error}: ${props.i18n.could_not_find_set_canvas}`, 100, 100);
                isError = true;
            }
            ctx.fillStyle = '#000000';

            let currentColor = '#000000';
            let currentSize = 24;
            let currentFont = 'Noto Sans Light';

            const LaTeXMacros = currentPage.getLaTeXMacros();
            const MacroSha256 = calcSha256(JSON.stringify(LaTeXMacros));

            // foreach ast and render
            if (!isError) {
                AST.forEach(statement => {
                    try {
                        if (statement.type === CodeKeyWord.SET) {
                            if (statement.key === CodeKeyWord.COLOR) {
                                ctx.stroke();
                                ctx.beginPath();
                                currentColor = statement.value;
                                if (currentColor[0] !== '#') currentColor = '#' + currentColor;
                                ctx.fillStyle = currentColor;
                                ctx.strokeStyle = currentColor;
                            } else if (statement.key === CodeKeyWord.SIZE) {
                                ctx.stroke();
                                ctx.beginPath();
                                currentSize = statement.value * canvasRef.value!.height / pageSize.height;
                                // scale font size in the same ratio
                                ctx.font = `${currentSize} "${currentFont}"`;
                                ctx.lineWidth = currentSize;
                            } else if (statement.key === CodeKeyWord.FONT) {
                                currentFont = statement.value;
                                ctx.font = `${currentSize} "${currentFont}"`;
                            }
                        } else if (statement.type === CodeKeyWord.DRAW) {
                            ctx.moveTo(
                                statement.from[0] * canvasRef.value!.width / pageSize.width,
                                statement.from[1] * canvasRef.value!.height / pageSize.height
                            );
                            ctx.lineTo(
                                statement.to[0] * canvasRef.value!.width / pageSize.width,
                                statement.to[1] * canvasRef.value!.height / pageSize.height
                            );
                        } else if (statement.type === CodeKeyWord.TEXT) {
                            let text = statement.text;
                            const renderX = parseInt((statement.method === CodeKeyWord.ABS
                                ? (statement.x * canvasRef.value!.width / pageSize.width)
                                : (statement.x * canvasRef.value!.width)).toString());
                            const renderY = parseInt((statement.method === CodeKeyWord.ABS
                                ? (statement.y * canvasRef.value!.height / pageSize.height)
                                : (statement.y * canvasRef.value!.height)).toString());

                            const contentSha256 = calcSha256(`color${currentColor};size${currentSize};font${currentFont};content${text};macro${MacroSha256}`);

                            if (props.project.cache.LaTeX.code2Image[contentSha256]) {
                                // hit cache
                                const image = imageElementMap.get(contentSha256);
                                if (image) {
                                    ctx.drawImage(image, renderX, renderY);
                                } else {
                                    const img = new Image();
                                    img.src = props.project.cache.LaTeX.code2Image[contentSha256];
                                    img.onload = () => {
                                        ctx.drawImage(img, renderX, renderY);
                                        imageElementMap.set(contentSha256, img);
                                    };
                                }
                            } else {
                                if (isCouldRunHtml2canvas) {
                                    // couldn't convert, not operate, save memory
                                    isCouldRunHtml2canvas = false;
                                    setTimeout(() => {
                                        isCouldRunHtml2canvas = true;
                                    }, 2000);
                                    // miss cache, render again
                                    const renderDiv = document.createElement('div');
                                    // get all math fragments
                                    const mathFragments = Array.from(text.matchAll(/\$.*?\$/g));
                                    for (let i = 0; i < mathFragments.length; ++i) {
                                        let LaTeXString = '';
                                        const contentSha256 = calcSha256(calcSha256(mathFragments[i][0]) + MacroSha256);
                                        if (props.project.cache.LaTeX.code2MathML[contentSha256]) {
                                            LaTeXString = props.project.cache.LaTeX.code2MathML[contentSha256];
                                        } else {
                                            const lines = mathFragments[i][0].slice(1, -1).split('\\\\');
                                            // split by LF
                                            for (let j = 0; j < lines.length; ++j) {
                                                const content = lines[j];
                                                const contentSha256 = calcSha256(calcSha256(content) + MacroSha256);
                                                let LaTeXString = '';
                                                if (props.project.cache.LaTeX.code2MathML[contentSha256]) {
                                                    LaTeXString = props.project.cache.LaTeX.code2MathML[contentSha256];
                                                } else {
                                                    LaTeXString = katex.renderToString(content, {
                                                        strict: 'ignore',
                                                        throwOnError: false,
                                                        macros: LaTeXMacros
                                                    });
                                                }
                                                // store to cache
                                                // eslint-disable-next-line vue/no-mutating-props
                                                props.project.cache.LaTeX.code2MathML[contentSha256] = LaTeXString;
                                                lines[j] = LaTeXString;
                                            }
                                            const content = lines.join('<br />');
                                            LaTeXString = content;
                                            // eslint-disable-next-line vue/no-mutating-props
                                            props.project.cache.LaTeX.code2MathML[contentSha256] = LaTeXString;
                                        }
                                        text = text.replace(mathFragments[i][0], LaTeXString);
                                    }
                                    renderDiv.innerHTML = text;

                                    renderDiv.style.color = currentColor;
                                    renderDiv.style.font = currentFont;
                                    renderDiv.style.fontSize = currentSize + 'px';
                                    renderDiv.style.width = canvasRef.value!.width - renderX + 'px';/* auto change into next line */

                                    document.body.insertBefore(renderDiv, document.body.childNodes[0]);
                                    setTimeout(() => {
                                        props.renderText(renderDiv, {
                                            backgroundColor: null, // background transparent
                                            useCORS: true,
                                            logging: false
                                        }, canvasRef.value!.width - renderX /* auto change into next line */).then(dataurl => {
                                            document.body.removeChild(renderDiv);
                                            // eslint-disable-next-line vue/no-mutating-props
                                            props.project.cache.LaTeX.code2Image[contentSha256] = dataurl;
                                            const img = new Image();
                                            img.src = dataurl;
                                            img.onload = () => {
                                                imageElementMap.set(contentSha256, img);
                                            };
                                        });
                                    }, 50);
                                }
                            }
                        } else if (statement.type === CodeKeyWord.IMAGE) {
                            const renderX = parseInt((statement.method === CodeKeyWord.ABS
                                ? (statement.x * canvasRef.value!.width / pageSize.width)
                                : (statement.x * canvasRef.value!.width)).toString());
                            const renderY = parseInt((statement.method === CodeKeyWord.ABS
                                ? (statement.y * canvasRef.value!.height / pageSize.height)
                                : (statement.y * canvasRef.value!.height)).toString());
                            const sizeWidth = parseInt((statement.size[0] === CodeKeyWord.ABS
                                ? (statement.size[1] * canvasRef.value!.width / pageSize.width)
                                : (statement.size[1] * canvasRef.value!.width)).toString());
                            const sizeHeight = parseInt((statement.size[0] === CodeKeyWord.ABS
                                ? (statement.size[2] * canvasRef.value!.height / pageSize.height)
                                : (statement.size[2] * canvasRef.value!.height)).toString());
                            if (props.project.images[statement.image]) {
                                const image = imageElementMap.get(statement.image);
                                if (image) {
                                    ctx.drawImage(image, renderX, renderY, sizeWidth, sizeHeight);
                                } else {
                                    const dataurl = props.project.images[statement.image];
                                    const img = new Image();
                                    img.src = dataurl;
                                    img.onload = () => {
                                        ctx.drawImage(img, renderX, renderY, sizeWidth, sizeHeight);
                                        imageElementMap.set(statement.image, img);
                                    };
                                }
                            } else {
                                ctx.fillStyle = '#ff0000';
                                ctx.font = '16px "Noto Sans Light"';
                                ctx.fillText(props.i18n.template('cannot_locate_image', {
                                    image: statement.image
                                }), renderX + 20, renderY + 20);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                });
            }
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 420, 50);
            ctx.fillStyle = '#000000';
            ctx.font = '16px "Noto Sans Light"';
            ctx.fillText(props.platform.replace('&emsp;', ''), 20, 20);
            ctx.font = '12px "Noto Sans Light"';
            ctx.fillText(`${props.i18n.render_preview} | ${props.i18n.fps}: ${renderRecord.length} | ${props.i18n.time}: ${getTimeFormat()}`, 20, 40);

            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
});

const getTimeFormat = () => {
    return new Date(
        new Date().getTime() - (new Date().getTimezoneOffset()) * 1000 * 60 // times second(60) and ms(1000)
        // process timezone
    ).toISOString().slice(0, -1);
    // display local time, not iso time, remove zero flag
};

const onCanvasClick = ($event: MouseEvent) => {
    if (canvasRef.value) {
        if (props.mode === 'insert-text') {
            const clickPos = [$event.offsetX, $event.offsetY];
            const rwdPos = [
                clickPos[0] / canvasRef.value.width,
                clickPos[1] / canvasRef.value.height
            ]; // calculate responsive position
            console.log($event);
            emits('insertStatement', `text rwd ${rwdPos[0]} ${rwdPos[1]} `);
        } else if (props.mode === 'normal') {
            // download image
            canvasRef.value.toBlob(blob => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.download = `MEP Render Preview - ${props.project.filename} - ${getTimeFormat()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'png', 1);
        }
    }
};

const lastDrawPos = reactive({
    x: -1,
    y: -1,
    boundingRect: {
        left: 0,
        top: 0
    },
    border: {
        left: 0,
        top: 0
    },
    padding: {
        top: 0,
        left: 0
    }
});
const startDraw = ($event: MouseEvent) => {
    if (props.mode === 'draw' && canvasRef.value) {
        isDrawStart.value = true;
        const rect = canvasRef.value.getBoundingClientRect();
        lastDrawPos.boundingRect.left = rect.left;
        lastDrawPos.boundingRect.top = rect.top;
        lastDrawPos.border.left = parseFloat(canvasRef.value.style.borderLeft) || 0;
        lastDrawPos.border.top = parseFloat(canvasRef.value.style.borderTop) || 0;
        lastDrawPos.padding.left = parseFloat(canvasRef.value.style.paddingLeft) || 0;
        lastDrawPos.padding.top = parseFloat(canvasRef.value.style.paddingTop) || 0;
        const pos = getMousePosition($event);
        lastDrawPos.x = pos.x;
        lastDrawPos.y = pos.y;
    }
};
const draw = ($event: MouseEvent) => {
    if (isDrawStart.value && canvasRef.value) {
        const pos = getMousePosition($event);
        emits('insertStatement', `draw from ${lastDrawPos.x} ${lastDrawPos.y} to ${pos.x} ${pos.y}`);
        lastDrawPos.x = pos.x;
        lastDrawPos.y = pos.y;
    }
};
const endDraw = () => {
    if (isDrawStart.value) {
        isDrawStart.value = false;
    }
};

const getMousePosition = ($event: MouseEvent) => {
    if (canvasRef.value) {
        const x = $event.clientX;
        const y = $event.clientY;

        const canvasX = x - lastDrawPos.boundingRect.left - lastDrawPos.border.left - lastDrawPos.padding.left;
        const canvasY = y - lastDrawPos.boundingRect.top - lastDrawPos.border.top - lastDrawPos.padding.top;
        return {
            x: ~~(canvasX / canvasRef.value.width * pageSize.width),
            y: ~~(canvasY / canvasRef.value.height * pageSize.height)
        };
    } else {
        return {
            x: -1,
            y: -1
        };
    }
};
</script>
