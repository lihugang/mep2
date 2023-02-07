import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
self.MonacoEnvironment = {
    getWorker() {
        // js/ts/css/html doesn't need support, we use our custom script language
        return new EditorWorker();
    }
};