<template>
    <div class="toolbar">
        <dropDownList :title="windowOperation.title" :content="windowOperation.content" @do="windowHandler">
        </dropDownList>
        &nbsp;
        <dropDownList :title="fileOperation.title" :title-image="fileOperation.titleImage"
            :content="fileOperation.content" @do="fileHandler"></dropDownList>
        &nbsp;
        {{ props.i18n.color }}: <input type="color" v-model="editorConfig.color"
            @change="emits('settingChange', 'color', editorConfig.color)" />
        &nbsp;
        {{ props.i18n.size }}: <input type="number" min="1" max="301" v-model="editorConfig.fontSize" class="size"
            @change="emits('settingChange', 'size', editorConfig.fontSize)" />
        &nbsp;
        {{  props.i18n.fonts }}: <dropDownList :title="'Noto Sans Light'" :content="supportFonts.map(font => {
            return {
                name: font.name,
                content: font.name,
                useFont: font.name
            };
        })" :is-search="true" @change="(content: string) => emits('settingChange', 'font', content)"></dropDownList>
        &nbsp;
        <input type="number" min="1" :max="projectRef.pages.length + 1" v-model="currentPage"
            @change="emits('switchPage', currentPage)" class="current-page switch-page"
            @wheel="onMouseWheel($event)" />&thinsp;/&thinsp;<input type="number" :value="projectRef.pages.length + 1"
            class="max-page switch-page" readonly />
        &nbsp;
        <button @click="deleteCurrentPage" :disabled="currentPage === 1">{{ props.i18n.delete_this_page }}</button>
        &nbsp;
        {{  props.i18n.mode }}: <select class="select-mode" v-model="mode" @change="emits('settingChange', 'mode', mode)">
            <option value="normal">{{ props.i18n.normal }}</option>
            <option value="insert-text">{{ props.i18n.insert_text }}</option>
            <option value="draw">{{ props.i18n.draw }}</option>
        </select>
    </div>
</template>
<style scoped>
.toolbar {
    position: absolute;
    top: 22px;
    left: 0%;
    width: calc(100% - 48px);
    padding: 2px 20px;
    user-select: none;
    border-bottom: 1px solid rgb(40, 40, 40);
    overflow-y: auto;
}

.size,
.switch-page {
    outline: none;
    background-color: snow;
    color: rgb(32, 32, 32);
    padding: 0px 6px;
    border: 1px solid rgb(86, 175, 203);
}

.size:focus,
.switch-page:focus {
    background-color: rgb(220, 220, 220);
}

.size::selection,
.switch-page::selection {
    background-color: rgb(106, 195, 223);
}

.switch-page {
    width: 28px;
}

button {
    background-color: rgb(40, 162, 244);
    border-radius: 8px;
    color: snow;
    padding: 2px 12px;
    border: 0px;
    cursor: pointer;
}

button:hover {
    background-color: rgb(20, 142, 224);
    color: rgb(240, 240, 240);
}

button:disabled {
    backdrop-filter: brightness(75%);
    cursor: not-allowed;
}

select {
    border-radius: 8px;
    outline: none;
    background-color: rgb(181, 247, 227);
    color: rgb(40, 40, 40);
    padding: 2px 6px;
}

option:hover {
    background-color: rgb(161, 227, 207);
    color: rgb(60, 60, 60);
    backdrop-filter: brightness(80%)
}
</style>
<script lang="ts" setup>
/* eslint-disable indent */
/* indent conflicts with switch statements */
/* eslint-disable func-call-spacing */
import { defineProps, reactive, defineEmits, defineExpose, ref } from 'vue';
import { useRouter } from 'vue-router';
import dropDownList from '@/components/drop-down-list.vue';
import type { dropDownList as dropDownListType } from '@/components/drop-down-list-type';
import type { i18nMap } from '@/i18n';
import type { ElectronFile } from '@/platform/file';
import isElectron from '@/api/isElectron';
import historyRecord from '@/api/getHistoryRecord';
import requestReadfile from '@/api/requestReadFile';
import getClientFonts from '@/utils/getClientFonts';
import { Project } from '@/utils/ProjectManager';

const props = defineProps<{
    i18n: i18nMap,
}>();
const i18n = reactive(props.i18n);

const emits = defineEmits(['openFile', 'save', 'render', 'switchPage', 'settingChange']);

const editorConfig = reactive({
    color: '#000000',
    fontSize: 1,
    fontFamily: 'Noto Sans Light',
    mode: 'normal'
});

const projectRef = ref(new Project());
const currentPage = ref(1);

defineExpose({
    editorConfig,
    projectRef,
    currentPage
});

const deleteCurrentPage = () => {
    currentPage.value--;
    projectRef.value.pages.splice(currentPage.value, 1);
    emits('switchPage', currentPage.value);
};

const windowOperation = reactive({
    title: i18n.window,
    content: [{
        name: 'new',
        content: i18n.new_window
    }, {
        name: 'close',
        content: i18n.close_window
    }]
});
const windowHandler = (action: string) => {
    switch (action) {
        case 'new':
            window.open('/editor', '_blank');
            break;
        case 'close':
            try {
                useRouter().push('/');
            } catch (e) {
                location.href = '/';
                // vue-router error, change uri directly
            }
    }
};

const fileOperation: {
    title: string;
    titleImage: string;
    content: dropDownListType[]
} = reactive({
    title: i18n.file,
    titleImage: '/assets/file.svg',
    content: []
});

isElectron.then(isElectron => {
    if (isElectron) {
        // app mode
        // support write file into disk directly
        fileOperation.content.push(...[
            {
                name: 'open',
                content: i18n.open,
                img: '/assets/upload.svg'
            },
            // {
            //     name: 'save',
            //     content: i18n.save_project,
            //     img: '/assets/download.svg'
            // },
            // TODO
            {
                name: 'save-as',
                content: i18n.save_target_as,
                img: '/assets/download.svg'
            },
            {
                name: 'cur-png',
                content: i18n.export_this_page_as_png,
                img: '/assets/photo.svg'
            },
            {
                name: 'cur-pdf',
                content: i18n.export_this_page_as_pdf,
                img: '/assets/file.svg'
            },
            {
                name: 'all-png',
                content: i18n.export_all_page_as_png,
                img: '/assets/photo-group.svg'
            },
            {
                name: 'all-pdf',
                content: i18n.export_all_page_as_pdf,
                img: '/assets/file.svg'
            }
        ]);
    } else {
        // web platform, remove some functions to enforce the user to use app
        fileOperation.content.push(...[
            {
                name: 'open',
                content: i18n.open,
                img: '/assets/upload.svg'
            },
            {
                name: 'save-as',
                content: i18n.save_project,
                img: '/assets/download.svg'
            },
            // web platform not support save to specified file, the effects of save and save-as are the same
            {
                name: 'cur-png',
                content: i18n.export_this_page_as_png,
                img: '/assets/photo.svg'
            },
            {
                name: 'all-pdf',
                content: i18n.export_all_page_as_pdf,
                img: '/assets/file.svg'
            }
        ]);
    }
});

const formatFilepath = (filepath: string) => {
    if (filepath.length < 32) {
        return filepath;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const filename = filepath.split('/').at(-1)!;
        if (filename.length >= 32) return '...' + filename.slice(-32 + 3);
        else return filepath.substring(0, 32 - 4 - filename.length) + '.../' + filename;
    }
};

historyRecord.then(records => {
    records.forEach(filepath => {
        fileOperation.content.push({
            name: `fopen${filepath}`,
            content: formatFilepath(filepath.replaceAll('\\', '/')),
            img: '/assets/file.svg'
        });
    });
});

const fileHandler = (action: string) => {
    switch (action) {
        case 'open':
            {
                const element = document.createElement('input');
                element.type = 'file';
                element.accept = '.imm, .im2';
                element.click();
                element.addEventListener('change', () => {
                    const file = element.files && element.files[0];
                    file && emits('openFile', file, (file as ElectronFile).path || null);
                });
            }
            break;
        case 'save':
        case 'save-as':
            emits('save',
                action === 'save' // is save as
            );
            break;
        case 'cur-png':
        case 'cur-pdf':
            emits('render',
                false, // is render all pages
                action.indexOf('png') !== -1 // is export images
            );
            break;
        case 'all-png':
        case 'all-pdf':
            emits('render',
                true, // is render all pages
                action.indexOf('png') !== -1 // is export images
            );
            break;
    }
    if (action.substring(0, 5) === 'fopen') {
        // request server for open local file
        const filepath = action.substring(5);
        requestReadfile(filepath).then(content =>
            emits('openFile',
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                new File([content], filepath.split('/').at(-1)!),
                filepath
            )
        );
    }
};

const supportFonts = reactive<{
    name: string;
    blob: () => Promise<Blob>
}[]>([
    {
        name: 'Noto Sans Light',
        blob: () => fetch('/fonts/NotoSans-Light.ttf').then(result => result.blob())
    }
]);
getClientFonts.then((fonts) => {
    fonts.forEach(font => {
        supportFonts.push({
            name: `${font.fullName}`,
            blob: font.blob
        });
    });
});

const onMouseWheel = ($event: WheelEvent) => {
    if ($event.deltaY < 0) {
        // next page
        if (currentPage.value <= projectRef.value.pages.length) {
            currentPage.value++;
            emits('switchPage', currentPage.value);
        }
    }
    if ($event.deltaY > 0) {
        // previous page
        if (currentPage.value !== 1) {
            // has the previous page
            currentPage.value--;
            emits('switchPage', currentPage.value);
        }
    }
};

const mode = ref('normal');
</script>
