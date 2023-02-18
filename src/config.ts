export interface config {
    fontFamily: string;
    language: 'en-US' | 'zh-CN';
    editor: {
        color: string;
        fontSize: number;
        preferTextMode: 'auto' | 'multi' | 'single';
    },
    snippets: {
        text: string;
        code: string;
    }[];
    experiments: {
        renderThreadPool: {
            enable: boolean;
            counts: number;
        }
    }
    update: {
        checkForUpdate: boolean;
        autoUpdate: boolean;
    }
}
