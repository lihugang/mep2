/* eslint-disable indent */
/* eslint-disable space-before-function-paren */
import calcSha256 from './calcSha256WithWorker';
import { CodeAST, CodeKeyWord } from '@/utils/AST/AST.type';
import { AST2String, String2AST } from './AST/converter';
import * as zlib from '@/utils/zlib/index';
import sha256 from 'sha256';
import getClientFonts from './getClientFonts';
import { i18nMap } from '@/i18n';

export type ImageBase64 = string;
export type FontBase64 = string;
export type LatexExpression = string;
export type ColorHex = string;
export type sha256 = string;
export type rangeInImage = number; // Range: 0 - 1

export type SourceCode = string;

export type v1Format = {
    image: ImageBase64,
    marks: {
        content: LatexExpression;
        pos: {
            x: rangeInImage;
            y: rangeInImage;
        };
        color: ColorHex;
        size: number;
        id: string;
    }[];
    filename?: string;
}
export type v2Page = {
    sha256: null | string;
    code: CodeAST;
}
export type v2Format = {
    author: string;
    editTime: number;
    createTime: number;
    cache: {
        LaTeX: {
            code2MathML: {
                [index: sha256]: string
            },
            code2Image: {
                [index: sha256]: ImageBase64
            }
        },
        Page: (null | ImageBase64)[]
    },
    pages: v2Page[],
    fonts: {
        [font: string]: FontBase64
    },
    images: {
        [sha256: sha256]: ImageBase64
    }
};

export class Page {
    code: CodeAST;
    screen: {
        height: number;
        width: number;
    }

    constructor(code: CodeAST | string, height = -1, width = -1) {
        if (typeof code === 'string') this.code = Page.String2AST(code);
        else this.code = code;
        this.screen = {
            height: height,
            width: width
        };
    }

    get sha256() {
        return calcSha256(
            Page.AST2String(this.code)
        );
    }

    get AST() {
        return this.code;
    }

    set AST(value) {
        this.code = value;
    }

    get codeString() {
        return Page.AST2String(this.code);
    }

    set codeString(value) {
        this.code = Page.String2AST(value);
    }

    static AST2String(AST: CodeAST): string {
        return AST2String(AST);
    }

    static String2AST(code: string): CodeAST {
        return String2AST(code);
    }

    getLaTeXMacros(): {
        [key: string]: string
    } {
        const result: {
            [key: string]: string
        } = {};
        this.code.forEach(statement => {
            if (statement.type === CodeKeyWord.LATEX_MACRO) {
                result[statement.key] = statement.value;
            }
        });
        return result;
    }
}

export class InvalidFormatError extends TypeError { }
export class UnknownError extends Error { }

export class Project {
    author = '';
    filename = '';
    editTime = new Date().getTime();
    createTime = new Date().getTime();
    pages: Page[] = [];
    images: v2Format['images'] = {};
    cache: v2Format['cache'] = {
        LaTeX: {
            code2Image: {},
            code2MathML: {}
        },
        Page: []
    };

    fonts: v2Format['fonts'] = {};
    path?: string;

    static from(file: File): Promise<Project> {
        if (file.name.endsWith('.imm')) {
            return Project.loadFromV1(file) as Promise<Project>;
        } else if (file.name.endsWith('.im2')) {
            return Project.loadFromV2(file) as Promise<Project>;
        } else return Promise.reject(new InvalidFormatError('Bad file format.'));
    }

    private static loadFromV1(file: File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onerror = () => reject(new UnknownError('Failed to read file'));
            reader.onload = () => {
                let content: null | v1Format = null;
                try {
                    content = JSON.parse(reader.result as string);
                } catch {
                    return reject(new InvalidFormatError('Failed to parse json: format v1'));
                }
                if (content) {
                    const project = new Project();
                    const imageData = content.image;
                    calcSha256(imageData).then(imageDataSha256 => {
                        project.images[imageDataSha256] = imageData; // put image
                        const codeAST: CodeAST = [{
                            type: CodeKeyWord.IMAGE,
                            method: CodeKeyWord.RWD,
                            x: 0,
                            y: 0,
                            size: [CodeKeyWord.RWD, 1, 1],
                            image: imageDataSha256
                            // put image fullscreen
                        }];
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        content!.marks.forEach(mark => {
                            codeAST.push({
                                type: CodeKeyWord.SET,
                                key: CodeKeyWord.COLOR,
                                value: mark.color.substring(1)
                            }); // set mark color
                            codeAST.push({
                                type: CodeKeyWord.SET,
                                key: CodeKeyWord.SIZE,
                                value: mark.size
                            }); // set mark size
                            codeAST.push({
                                type: CodeKeyWord.TEXT,
                                method: CodeKeyWord.RWD,
                                x: mark.pos.x,
                                y: mark.pos.y,
                                text: '$' + mark.content.replaceAll('\n', ' \\\\ ') + '$ '
                            }); // add mark
                        });
                        codeAST.push({
                            type: CodeKeyWord.NULL
                        }); // new line
                        project.pages[0] = new Page(codeAST);
                        project.filename = file.name;
                        resolve(project);
                    });
                }
            };
        });
    }

    private static loadFromV2(file: File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file.slice(0, 1024));
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    if (reader.result[0] === 'M' && reader.result[1] === 'E' && reader.result[2] === 'P') {
                        const version = reader.result.substring(3).split('---')[0].split('.');
                        if (version[0] === '2' && version[1] === '0' && version[2] === '0') {
                            // 2.0.0
                            const contentBlob = file.slice('MEP'.length + version.join('.').length + '---'.length);
                            const reader = new FileReader();
                            reader.readAsArrayBuffer(contentBlob);
                            reader.onload = () => {
                                if (reader.result instanceof ArrayBuffer) {
                                    const uint8Buffer = new Uint8Array(reader.result);
                                    zlib.ungzip(uint8Buffer).then(buffer => new Blob([buffer], {
                                        type: 'application/json'
                                    })).then(blob => {
                                        Project.loadFromV2_0_0(blob, file.name).then(resolve).catch(reject);
                                    });
                                }
                            };
                        } else {
                            reject(new Error(`Failed to recognize version ${version.join('.')}. Check whether your software is up to date.`));
                        }
                    } else {
                        reject(new Error('Invalid file format'));
                    }
                }
            };
        });
    }

    // eslint-disable-next-line camelcase
    private static loadFromV2_0_0(blob: Blob, filename: string) {
        return new Promise((resolve, reject) => {
            // TODO unzip gzip
            const reader = new FileReader();
            reader.readAsText(blob);
            reader.onerror = () => reject(new UnknownError('Failed to read file'));
            reader.onload = () => {
                let content: null | v2Format = null;
                try {
                    content = JSON.parse(reader.result as string);
                } catch {
                    return reject(new InvalidFormatError('Failed to parse json: format v2.0.0'));
                }
                if (content) {
                    const project = new Project();
                    project.filename = filename;
                    project.author = content.author;
                    project.cache = content.cache;
                    project.createTime = content.createTime;
                    project.editTime = new Date().getTime();
                    project.images = content.images;
                    project.fonts = content.fonts;
                    project.pages = [];
                    content.pages.forEach(page => project.pages.push(
                        new Page(page.code)
                    ));
                    const currentFonts = new Set(Array.from(document.fonts).map(font => font.family));
                    for (const key in content.fonts) {
                        // register fonts
                        if (!currentFonts.has(key)) {
                            // font not exists, register it
                            ((key: string, value: FontBase64) => {
                                // base64 to blob
                                fetch(value)
                                    .then(response => response.blob())
                                    .then(blob => {
                                        const url = URL.createObjectURL(blob);
                                        const fontFace = new FontFace(key, `url("${url}")`);
                                        document.fonts.add(fontFace);
                                        fontFace.load();
                                    });
                            })(key, content.fonts[key]);
                        }
                    }
                    resolve(project);
                }
            };
        });
    }

    async save(author: string, compressed: boolean, keepCache: boolean, embedFonts: boolean, i18n: i18nMap) {
        const json: v2Format = {
            author: author,
            editTime: new Date().getTime(),
            createTime: this.createTime,
            cache: keepCache
                ? this.cache
                : {
                    LaTeX: {
                        code2Image: {},
                        code2MathML: {}
                    },
                    Page: []
                },
            fonts: {},
            pages: this.pages.map(item => {
                return {
                    code: item.AST,
                    sha256: sha256(item.codeString)
                };
            }),
            images: this.images
        };

        if (embedFonts) {
            const fontData = await this.getFonts(i18n);
            json.fonts = fontData;
        }

        const content = JSON.stringify(json);

        const compressLevel = compressed ? 9 : 0;
        zlib.gzip(content, {
            level: compressLevel
        }).then(result => {
            const blob = new Blob(['MEP', '2.0.0', '---', result]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = this.filename === ''
                ? 'MEP.im2'
                : (
                    (this.filename.endsWith('.im2')
                        ? this.filename
                        : (this.filename.endsWith('.imm')
                            ? (this.filename.slice(0, -3) + 'im2')
                            : (this.filename + '.imm')
                        )
                    )
                );
            a.href = url;
            a.target = '_blank';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    getFonts(i18n: i18nMap): Promise<Record<string, string>> {
        return new Promise((resolve) => {
            const result: Record<string, string> = {};
            const supportFonts: {
                name: string;
                blob: () => Promise<Blob>
            }[] = [
                    {
                        name: 'Noto Sans Light',
                        blob: () => fetch('/fonts/NotoSans-Light.ttf').then(result => result.blob())
                    }
                ];
            getClientFonts.then((fonts) => {
                fonts.forEach(font => {
                    supportFonts.push({
                        name: `${font.fullName}`,
                        blob: font.blob
                    });
                });

                const fontsMap = new Map(supportFonts.map(item => [item.name, item.blob]));

                const awaitPromises: Promise<void>[] = [];

                this.pages.forEach(page => {
                    const AST = page.AST;
                    AST.forEach(statement => {
                        if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.FONT) {
                            const fontName = statement.value;
                            const blobGetter = fontsMap.get(fontName);
                            if (blobGetter) {
                                awaitPromises.push(new Promise(resolve => {
                                    blobGetter().then(blob => {
                                        const reader = new FileReader();
                                        reader.readAsDataURL(blob);
                                        reader.onload = () => {
                                            if (typeof reader.result === 'string') {
                                                result[fontName] = reader.result;
                                                resolve();
                                            }
                                        };
                                    });
                                }));
                            }
                        }
                    });
                });

                Promise.all(awaitPromises).then(() => resolve(result));
            });
        });
    }
}
export default Project;
