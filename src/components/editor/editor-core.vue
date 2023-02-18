<template>
    <div ref="editorContainer">
        <div class="editor" :id="editorID" ref="editorRef"></div>
    </div>
</template>
<style scoped></style>
<script lang="ts" setup>
import { defineExpose, defineEmits, defineProps, ref, onMounted, watch, reactive } from 'vue';
import * as Monaco from 'monaco-editor';
import Project from '@/utils/ProjectManager';
import * as IntelligentCode from '@/utils/AST/intelligent-code';
import getClientFonts from '@/utils/getClientFonts';
import type { i18nMap } from '@/i18n';
import type { config } from '@/config';

const editorID = 'e' + Math.random().toString(36).substring(3);
const emits = defineEmits(['compileError', 'preview', 'highlight']);
const props = defineProps<{
    i18n: i18nMap,
    doAction: {
        type: 'null' | 'insertStatement',
        statement?: string
    },
    snippets: config['snippets']
}>();

const project = ref(new Project());
const currentPage = ref(1);
defineExpose({
    project,
    currentPage
});

const clientFonts = ['Noto Sans Light'];
getClientFonts.then(fonts => {
    fonts.forEach(font => {
        clientFonts.push(`${font.fullName}`);
    });
});

IntelligentCode.registerLanguage();
IntelligentCode.highlightLanguage();
IntelligentCode.autoComplete(clientFonts, props.i18n, project);
IntelligentCode.registerSnippets(props.snippets);

const editorValue = ref('');
const editorRef = ref<HTMLElement>();
let editor: null | Monaco.editor.IStandaloneCodeEditor = null;

onMounted(() => {
    if (editorRef.value) {
        editor = Monaco.editor.create(editorRef.value, {
            value: '',
            accessibilitySupport: 'on',
            colorDecorators: true,
            automaticLayout: false,
            language: 'mep@2-script',
            theme: 'custom-highlight',
            selectOnLineNumbers: true,
            roundedSelection: true,
            glyphMargin: true,
            contextmenu: true,
            columnSelection: true,
            autoSurround: 'never',
            copyWithSyntaxHighlighting: true,
            cursorBlinking: 'solid',
            cursorSmoothCaretAnimation: true,
            cursorStyle: 'underline-thin',
            cursorWidth: 2,
            minimap: {
                enabled: true
            },
            links: true,
            overviewRulerBorder: false,
            renderLineHighlight: 'gutter',
            scrollBeyondLastColumn: 10,
            scrollBeyondLastLine: false,
            foldingStrategy: 'indentation',
            lineHeight: 0,
            fontSize: 14,
            lineNumbers: 'on',
            codeLens: true,
            codeLensFontFamily: 'Noto Sans Light',
            codeLensFontSize: 8,
            tabCompletion: 'on',
            cursorSurroundingLines: 3,
            folding: true,
            wordWrap: 'on'
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const editorModel = editor!.getModel()!;

    let isInsertDollarSymbolCool = false;
    editorModel.onDidChangeContent((e) => {
        if (isInsertDollarSymbolCool === false) {
            if (e.changes.at(-1)?.text.at(-1) === '$') {
                isInsertDollarSymbolCool = true;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const pos = editor!.getPosition()!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                editor!.executeEdits('', [{
                    range: {
                        startLineNumber: pos.lineNumber,
                        endLineNumber: pos.lineNumber,
                        startColumn: pos.column,
                        endColumn: pos.column
                    },
                    text: '$',
                    forceMoveMarkers: true
                }]);
                setTimeout(() => {
                    isInsertDollarSymbolCool = false;
                }, 1000);
            }
        }
    });

    const updateValue = () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const curEditorValue = editor!.getValue().replaceAll('  ', ' ').replaceAll(' \n', '\n');
        if (editorValue.value !== curEditorValue) {
            editorValue.value = curEditorValue;

            // code change, recompile it
            const page = project.value.pages[currentPage.value - 1];
            const markers = IntelligentCode.generateMark(page, editorValue.value, clientFonts, project.value.images, (e) => {
                emits('compileError', e);
            });
            Monaco.editor.setModelMarkers(editorModel, 'mep@2-script', markers);
        }
        requestAnimationFrame(updateValue);
    };
    updateValue();
});

watch(project.value.images, () => {
    // images change, generate marks
    if (editor) {
        const model = editor.getModel();
        if (model) {
            const page = project.value.pages[currentPage.value - 1];
            const markers = IntelligentCode.generateMark(page, editorValue.value, clientFonts, project.value.images, (e) => {
                emits('compileError', e);
            });
            Monaco.editor.setModelMarkers(model, 'mep@2-script', markers);
        }
    }
});

watch([project, currentPage], () => {
    const page = project.value.pages[currentPage.value - 1];
    editor && editor.setValue(
        page.codeString
    );
});
const lastEditorLayout = reactive({
    width: -1,
    height: -1
});
const editorContainer = ref<HTMLElement>();
setInterval(() => {
    if (editor && editorContainer.value) {
        if (lastEditorLayout.height !== editorContainer.value.offsetHeight && lastEditorLayout.width !== editorContainer.value.offsetWidth) {
            lastEditorLayout.height = editorContainer.value.offsetHeight;
            lastEditorLayout.width = editorContainer.value.clientWidth;
            editor.layout(lastEditorLayout);
        }
    }
}, 200);

const sendPreviewSignal = () => {
    if (editor) {
        const pos = editor.getPosition();
        if (pos) {
            const lines = editorValue.value.split('\n');
            const currentLine = lines[pos.lineNumber - 1];
            if (!currentLine) return requestAnimationFrame(sendPreviewSignal);
            if (currentLine.substring(0, 10) === 'set color ') {
                const color = currentLine.substring(10);
                emits('preview', 'color', color);
            } else if (currentLine.substring(0, 9) === 'set size ') {
                const size = parseInt(currentLine.substring(9));
                emits('preview', 'size', size);
            } else if (currentLine.substring(0, 9) === 'set font ') {
                const font = currentLine.substring(9);
                emits('preview', 'font', font);
            } else if (currentLine.substring(0, 6) === 'image ') {
                if (isCouldSendPreviewImageSignal) {
                    isCouldSendPreviewImageSignal = false;
                    setTimeout(() => {
                        isCouldSendPreviewImageSignal = true;
                    }, 10000);
                    const tokens = currentLine.split(' ');
                    const images = tokens[1].length === 64 ? tokens[1] : tokens[2];
                    if (project.value.images[images]) {
                        // image exists
                        emits('preview', 'image', images);
                    }
                }
            } else {
                // multi-line text macro LaTeX support
                const mathFragments = Array.from(currentLine.matchAll(/\$.*?\$/g));
                for (let i = 0; i < mathFragments.length; ++i) {
                    if (
                        (mathFragments[i].index ?? 0) <= pos.column - 1 &&
                        (mathFragments[i].index ?? 0) + mathFragments[i][0].length >= pos.column - 1
                    ) {
                        emits('preview', 'LaTeX', mathFragments[i][0].slice(1, -1));
                    }
                }
                emits('highlight', {
                    type: 'text',
                    pos: pos.lineNumber - 1
                });
            }
        }
    }
    requestAnimationFrame(sendPreviewSignal);
};
requestAnimationFrame(sendPreviewSignal);

let isCouldSendPreviewImageSignal = true;

watch(props.doAction, () => {
    if (props.doAction.type === 'insertStatement' && props.doAction.statement && editor) {
        let value = editor.getValue();
        if (value.at(-1) !== '\n') value += '\n'; // add LF symbol
        value += props.doAction.statement;
        editor.setValue(value);
        if (props.doAction.statement.includes('set color')) {
            emits('preview', 'color', props.doAction.statement.substring('set color '.length));
        }
        if (props.doAction.statement.includes('set font')) {
            emits('preview', 'font', props.doAction.statement.substring('set font '.length));
        }
        if (props.doAction.statement.includes('set size')) {
            emits('preview', 'size', props.doAction.statement.substring('set size '.length));
        }
    }
});
</script>
