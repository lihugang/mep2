<template>
    <div class="bkg"></div>
    <div class="root">
        <project-preview-bar :pageID="projectPreview.pageID" :project-name="projectPreview.projectName"
            ref="projectPreviewBarRef" />
        <status-bar :i18n="props.i18n" :status="currentStatus.text" :status-style="currentStatus.style"
            ref="statusBarRef" />
        <tool-bar :i18n="props.i18n" ref="pageConfig" @open-file="openFile" @switch-page="switchPage" class="tool"
            @setting-change="settingChange" @render="onRenderRequest" @save="onSave" />

        <div class="main" :style="(mainRegionPos as CSSProperties)" ref="mainRef">
            <editor-core ref="editorCoreRef" :i18n="props.i18n" class="editor-core"
                :style="(mainRegionLayout.editor as CSSProperties)" @compile-error="onCompileError"
                @preview="onEditorPreview" :doAction="editorAction" :snippets="props.config.snippets" />
            <render-preview ref="renderPreviewRef" class="render-preview"
                :style="(mainRegionLayout.preview as CSSProperties)" :height="mainRegionLayout.preview.height ?? '0px'"
                :width="mainRegionLayout.preview.width ?? '0px'" 
                :i18n="props.i18n"/>
            <render-canvas ref="renderCanvasRef" class="render-canvas"
                :style="(mainRegionLayout.canvas as CSSProperties)" :project="currentProject"
                :currentPage="projectPreview.pageID" :width="parseInt(mainRegionLayout.canvas.width ?? '0')"
                :height="parseInt(mainRegionLayout.canvas.height ?? '0')" :mode="userOperationMode"
                @insert-statement="canvasInsertStatement" :platform="platform" :renderText="html2canvas"
                :i18n="props.i18n" />
            <image-manager ref="imageManagerRef" class="image-manager"
                :style="(mainRegionLayout.image as CSSProperties)" :i18n="props.i18n" :project="currentProject"
                :height="mainRegionLayout.image.height ?? '0px'" :width="mainRegionLayout.image.width ?? '0px'" />
        </div>
    </div>

    <render-options-popup ref="renderOptionsRef" v-if="isShowRenderOptionsPopup" :i18n="props.i18n" />
    <save-options-popup ref="saveOptionsRef" v-if="isShowSaveOptionsPopup" :i18n="props.i18n" />
</template>
<style scoped>
.bkg {
    background-color: white;
    position: fixed;
    top: 0%;
    left: 0%;
    height: calc(100% - 8px);
    width: 100%;
    margin: 0px;
}

.editor-core {
    border-right: 2px solid skyblue;
}

.render-preview {
    border-top: 2px solid orangered;
    user-select: none;
}

.render-canvas {
    border-bottom: 2px solid gold;
}

.image-manager {
    border-left: 2px solid purple;
}

.root {
    margin: 0px;
    overflow-x: hidden;
    overflow-y: hidden;
}
</style>
<script lang="ts" setup>
/* eslint-disable space-before-function-paren */
import { defineAsyncComponent, defineProps, reactive, watch, ref, onMounted } from 'vue';
import type { CSSProperties } from 'vue';
import type { config } from '@/config';
import type { i18nMap } from '@/i18n';
// import getClientFonts from '@/utils/getClientFonts';
import { Project, Page } from '@/utils/ProjectManager';
import { CodeKeyWord, ParseCodeError } from '@/utils/AST/AST.type';
import isElectron from '@/api/isElectron';
import updateHistoryRecord from '@/api/updateHistoryRecord';
import render from '@/utils/render&export';
import html2canvasFactory from '@/utils/html2canvasWithThread';

const props = defineProps<{
    config: config,
    i18n: i18nMap
}>();

const platform = ref('');

const html2canvas = html2canvasFactory(props.config);

// load components async to improve loading speed

const projectPreviewBar = defineAsyncComponent(() => import('@/components/editor/projectPreviewBar.vue'));
const projectPreview = reactive({
    pageID: 1,
    projectName: props.i18n.untitled
});
const projectPreviewBarRef = ref<InstanceType<typeof projectPreviewBar>>();

const statusBar = defineAsyncComponent(() => import('@/components/editor/statusBar.vue'));
const currentStatus = reactive({
    text: props.i18n.loading_neccessary_components,
    style: {}
});
const statusBarRef = ref<InstanceType<typeof statusBar>>();
watch(statusBarRef, () => {
    if (statusBarRef.value) {
        const intervalID = setInterval(() => {
            if (statusBarRef.value && statusBarRef.value.showPlatform) {
                platform.value = statusBarRef.value.showPlatform;
                clearInterval(intervalID);
            }
        }, 500);
        // cannot watch .showPlatform, time always change, if use watch with options deep:true, performance will be worse
    }
});

const toolBar = defineAsyncComponent(() => import('@/components/editor/toolBar.vue'));
const pageConfig = ref<InstanceType<typeof toolBar>>();
watch(pageConfig, () => {
    if (pageConfig.value) {
        pageConfig.value.editorConfig.color = props.config.editor.color;
        pageConfig.value.editorConfig.fontSize = props.config.editor.fontSize;
        pageConfig.value.editorConfig.fontFamily = props.config.fontFamily;
        pageConfig.value.currentPage = projectPreview.pageID;
        pageConfig.value.projectRef = currentProject.value;
        currentProject.value.pages[0].codeString += `\nset color ${pageConfig.value.editorConfig.color.substring(1)}\nset size ${pageConfig.value.editorConfig.fontSize}\nset font ${pageConfig.value.editorConfig.fontFamily}\n\n`;
    }
}); // waiting for async components loading

watch(projectPreview, () => {
    if (pageConfig.value) {
        pageConfig.value.currentPage = projectPreview.pageID;
    }
}); // when page switches, tell toolbar to show

const currentProject = ref(new Project());
currentProject.value.pages[0] = new Page('set canvas 4096 2304'); // default canvas size 4096x2304 (4k 16:9)

const userOperationMode = ref<'normal' | 'insert-text' | 'draw'>('normal');

const openFile = (file: File, path: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    path = path || (file as any).path;
    currentStatus.text = 'Opening file...';
    isElectron.then(isElectron => {
        if (isElectron) {
            updateHistoryRecord(path);
        }
    });
    Project.from(file).then(project => {
        project.path = path;
        currentProject.value = project;
        currentStatus.text = '';
        pageConfig.value && (pageConfig.value.currentPage = 1);
        projectPreview.projectName = file.name || props.i18n.untitled;
    }).catch((err: unknown) => {
        alert(err);
        console.error(err);
    });
};

watch(currentProject, () => {
    // project change
    // tell tool bar update
    pageConfig.value && (pageConfig.value.projectRef = currentProject.value);
    editorCoreRef.value && (editorCoreRef.value.project = currentProject.value);
    updateMainRegionLayout();
}, {
    deep: true
});

const switchPage = (pageID: number) => {
    if (pageID === currentProject.value.pages.length + 1) {
        // create new page
        currentProject.value.pages[pageID - 1] = new Page([]);
    }
    projectPreview.pageID = pageID;
    editorCoreRef.value && (editorCoreRef.value.currentPage = pageID);
    updateMainRegionLayout();
};

const settingChange = (type: 'size' | 'color' | 'font' | 'mode', value: string | number) => {
    editorAction.type = 'insertStatement';
    if (type === 'color') {
        editorAction.statement = `set color ${value}`;
    } else if (type === 'font') {
        editorAction.statement = `set font ${value}`;
    } else if (type === 'size') {
        editorAction.statement = `set size ${value}`;
    } else if (type === 'mode') {
        userOperationMode.value = value.toString() as typeof userOperationMode.value;
    }
};

// -------------main-location-------------------

const getMainRegionPos = () => {
    if (pageConfig.value && pageConfig.value.$el) {
        const element = pageConfig.value.$el as HTMLElement;
        const top = element.offsetHeight + element.offsetTop;
        return {
            position: 'fixed',
            top: top + 'px',
            left: '0px',
            width: '100%',
            height: window.innerHeight - top - 20 /* STATUS_BAR */ + 'px'
        };
    }
    return {};
};
const mainRegionPos = ref<ReturnType<typeof getMainRegionPos>>({});
const getMainRegionLayout = () => {
    if (mainRegionPos.value.height && pageConfig.value) {
        const containerHeight = parseInt(mainRegionPos.value.height);
        const containerWidth = window.innerWidth;

        // locate render canvas first
        const currentPageRef = currentProject.value.pages[pageConfig.value.currentPage - 1];
        const AST = currentPageRef.AST;

        const rawCanvasSize = {
            height: 2304,
            width: 4096
        }; // default canvas size 4096x2304 (4k, 16:9)

        if (AST[0] && AST[0].type === CodeKeyWord.SET && AST[0].key === CodeKeyWord.CANVAS) {
            // find set canvas statement
            rawCanvasSize.height = AST[0].height;
            rawCanvasSize.width = AST[0].width;
        } // the first statement must be set canvas statement, if not found, compile will throw an error

        const transferCanvasSize = {
            height: 2304,
            width: 4096
        };

        if (rawCanvasSize.width >= rawCanvasSize.height) {
            // landscape
            // fill width first
            transferCanvasSize.width = Math.min(containerWidth * 0.6 /* leave at least 40% space for editor */, rawCanvasSize.width);
            transferCanvasSize.height = ~~(rawCanvasSize.height * transferCanvasSize.width / rawCanvasSize.width); // scale in the same ratio
            if (transferCanvasSize.height > containerHeight * 0.8 /* leave at least 20% space for image manager and render preview */) {
                // oh, it's too high
                // we choose filling height
                transferCanvasSize.height = containerHeight * 0.8;
                transferCanvasSize.width = ~~(rawCanvasSize.width * transferCanvasSize.height / rawCanvasSize.height); // scale in the same ratio
            }
            if (transferCanvasSize.height < 80) {
                transferCanvasSize.height = 80;
            }
            if (transferCanvasSize.width < 240) {
                transferCanvasSize.width = 240;
            }
        } else {
            // portrait
            // fill height first
            transferCanvasSize.height = Math.min(containerHeight * 0.8, rawCanvasSize.height);
            transferCanvasSize.width = ~~(rawCanvasSize.width * transferCanvasSize.height / rawCanvasSize.height);
            if (transferCanvasSize.width > containerWidth * 0.6) {
                transferCanvasSize.width = containerWidth * 0.6;
                transferCanvasSize.height = ~~(rawCanvasSize.height * transferCanvasSize.width / rawCanvasSize.width);
            }
            if (transferCanvasSize.height < 80) {
                transferCanvasSize.height = 80;
            }
            if (transferCanvasSize.width < 240) {
                transferCanvasSize.width = 240;
            }
        }
        return {
            canvas: {
                position: 'absolute',
                top: '0px',
                right: '0px',
                height: transferCanvasSize.height + 'px',
                width: transferCanvasSize.width + 'px'
            },
            editor: {
                position: 'absolute',
                top: '0px',
                left: '0px',
                height: transferCanvasSize.height + 'px',
                width: containerWidth - transferCanvasSize.width + 'px'
            },
            image: {
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                height: containerHeight - transferCanvasSize.height + 'px',
                width: transferCanvasSize.width + 'px'
            },
            preview: {
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                height: containerHeight - transferCanvasSize.height + 'px',
                width: containerWidth - transferCanvasSize.width + 'px'
            }
        };
    }
    return {
        canvas: {},
        editor: {},
        image: {},
        preview: {}
    };
};
const mainRegionLayout = ref<ReturnType<typeof getMainRegionLayout>>({ canvas: {}, editor: {}, image: {}, preview: {} });

const updateMainRegionLayout = () => {
    mainRegionPos.value = getMainRegionPos();
    mainRegionLayout.value = getMainRegionLayout();
};
watch(currentProject, () => {
    // project change
    updateMainRegionLayout();
});
window.addEventListener('resize', () => {
    // page resize
    updateMainRegionLayout();
});

onMounted(updateMainRegionLayout);

const EditorCore = defineAsyncComponent(() => import('@/components/editor/editor-core.vue'));
const editorCoreRef = ref<InstanceType<typeof EditorCore>>();
watch(editorCoreRef, () => {
    editorCoreRef.value && (editorCoreRef.value.project = currentProject.value);
});
const editorAction = reactive<{
    type: 'null' | 'insertStatement';
    statement?: string;
}>({
    type: 'null'
});

const onCompileError = (e: ParseCodeError) => {
    if (renderPreviewRef.value) {
        renderPreviewRef.value.display.type = 'compile-error';
        renderPreviewRef.value.display.error = e.getErrorMessage();
    }
};
const onEditorPreview = (type: 'color' | 'size' | 'font' | 'LaTeX' | 'image', text: string | number) => {
    if (renderPreviewRef.value) {
        if (type === 'color') {
            let color = text.toString();
            renderPreviewRef.value.display.type = 'render-color';
            if (color[0] !== '#') color = '#' + color;
            renderPreviewRef.value.display.color = color;
        }
        if (type === 'size') {
            const size = ~~text;
            renderPreviewRef.value.display.type = 'render-font-size';
            const AST = currentProject.value.pages[
                ((pageConfig.value?.currentPage ?? 1) - 1)
            ].AST;
            if (AST && AST[0] && AST[0].type === CodeKeyWord.SET && AST[0].key === CodeKeyWord.CANVAS) {
                renderPreviewRef.value.display.canvasHeight = AST[0].height;
            } else renderPreviewRef.value.display.canvasHeight = 2304; // 4k 16:9
            renderPreviewRef.value.display.size = size;
        }
        if (type === 'font') {
            const font = text.toString();
            renderPreviewRef.value.display.type = 'render-font-family';
            renderPreviewRef.value.display.fontFamily = font;
        }
        if (type === 'LaTeX') {
            const LaTeX = text.toString();
            renderPreviewRef.value.display.type = 'render-LaTeX';
            const currentPage = currentProject.value.pages[
                ((pageConfig.value?.currentPage ?? 1) - 1)
            ];
            const macros = currentPage?.getLaTeXMacros();
            renderPreviewRef.value.display.macros = macros;
            renderPreviewRef.value.display.LaTeX = LaTeX;
        }
        if (type === 'image') {
            const imageSha256 = text.toString();
            renderPreviewRef.value.display.type = 'preview-image';
            renderPreviewRef.value.display.dataurl = currentProject.value.images[imageSha256];
        }
    }
};

const renderPreview = defineAsyncComponent(() => import('@/components/editor/render-preview.vue'));
const renderPreviewRef = ref<InstanceType<typeof renderPreview>>();

const renderCanvas = defineAsyncComponent(() => import('@/components/editor/render-canvas.vue'));
const renderCanvasRef = ref<InstanceType<typeof renderCanvas>>();

const canvasInsertStatement = (statement: string) => {
    editorAction.type = 'insertStatement';
    editorAction.statement = statement;
};

const renderOptionsPopup = defineAsyncComponent(() => import('@/components/editor/render-options.vue'));
const renderOptionsRef = ref<InstanceType<typeof renderOptionsPopup>>();
const isShowRenderOptionsPopup = ref(false);

const onRenderRequest = (isRenderAllPages: boolean, isExportImages: boolean) => {
    isShowRenderOptionsPopup.value = true;
    let isEmitWatch = false;
    watch(renderOptionsRef, () => {
        if (!isEmitWatch && renderOptionsRef.value) {
            isEmitWatch = true;
            renderOptionsRef.value.options.isRenderAllPages = isRenderAllPages;
            renderOptionsRef.value.options.isExportImages = isExportImages;
            renderOptionsRef.value.onUserConfirm = (isUseWatermark: boolean, setProgress) => {
                render(currentProject.value, projectPreview.pageID, isRenderAllPages, isExportImages, isUseWatermark, html2canvas, setProgress);
            };
            renderOptionsRef.value.onUserCancel = () => {
                isShowRenderOptionsPopup.value = false;
            };
        }
    });
};

const imageManager = defineAsyncComponent(() => import('@/components/editor/image-manager.vue'));
const imageManagerRef = ref<InstanceType<typeof imageManager>>();

watch([projectPreviewBarRef, statusBarRef, pageConfig, editorCoreRef, renderPreviewRef, renderCanvasRef, imageManagerRef], (value) => {
    updateMainRegionLayout();
    let isAllLoaded = true;
    for (let i = 0; i < value.length; ++i) {
        if (!value[i]) isAllLoaded = false;
    }
    if (isAllLoaded) {
        // no display loading fonts
        currentStatus.text = '';
    }
});

const saveOptionsPopup = defineAsyncComponent(() => import('@/components/editor/save-options.vue'));
const saveOptionsRef = ref<InstanceType<typeof saveOptionsPopup>>();
const isShowSaveOptionsPopup = ref(false);

const onSave = () => {
    isShowSaveOptionsPopup.value = true;
    let isEmitWatch = false;
    watch(saveOptionsRef, () => {
        if (!isEmitWatch && saveOptionsRef.value) {
            isEmitWatch = true;
            saveOptionsRef.value.onUserConfirm = (author: string, compressed: boolean, keepCache: boolean, embedFonts: boolean) => {
                currentProject.value.save(author, compressed, keepCache, embedFonts);
            };
            saveOptionsRef.value.onUserCancel = () => {
                isShowSaveOptionsPopup.value = false;
            };
        }
    });
};
</script>
