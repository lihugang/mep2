import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
self.MonacoEnvironment = {
    getWorker(workerID: string, label: string) {
        return {
            json: new jsonWorker(),
            css: new cssWorker(),
            html: new htmlWorker(),
            typescript: new tsWorker(),
            javascript: new tsWorker()
        }[label] ?? new EditorWorker();
    }
};