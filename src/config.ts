export interface config {
    fontFamily: string;
    language: 'en-US' | 'zh-CN';
    editor: {
        color: string;
        fontSize: number;
    },
    snippets: {
        text: string;
        code: string;
    }[];
}
