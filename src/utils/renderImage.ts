/* eslint-disable space-before-function-paren */
import { Project } from '@/utils/ProjectManager';
// eslint-disable-next-line camelcase
import { Options as h2c_Options } from 'html2canvas';
import katex from 'katex';
import _ from 'lodash';
import calcSha256WithWorker from './calcSha256WithWorker';

import { CodeAST, CodeKeyWord, ParseCodeError } from './AST/AST.type';
import { toRaw } from 'vue';

// eslint-disable-next-line camelcase
export default function renderImage(AST: CodeAST, _images: Project['images'], LaTeXMacros: ReturnType<Project['pages'][number]['getLaTeXMacros']>, isRenderWaterMark: boolean, html2png: (element: HTMLElement, options?: Partial<h2c_Options> | undefined, width?: number) => Promise<string>) {
    return new Promise<string>((resolve, reject) => {
        // ensure render qualities, not use cache
        let processAST: CodeAST = [];
        const CanvasSize = {
            height: -1,
            width: -1
        };
        let isError = false;
        const awaitPromises: Promise<void>[] = [];
        const images = _.cloneDeep(_images);
        // console.log(images);

        let currentColor = '#000000';
        let currentFont = 'Noto Sans Light';
        let currentSize = 24;

        toRaw(AST).forEach((statement, index) => {
            if (index === 0) {
                // the first line must be "set canvas"
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.CANVAS) {
                    CanvasSize.height = statement.height;
                    CanvasSize.width = statement.width;
                } else {
                    isError = true;
                    return reject(new ParseCodeError(index + 1, 0, JSON.stringify(statement), 'set canvas xxx xxx'));
                }
            } else {
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.COLOR) {
                    currentColor = statement.value;
                    if (currentColor[0] !== '#') currentColor = '#' + currentColor;
                    processAST[index] = statement;
                }
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.SIZE) {
                    currentSize = statement.value;
                    processAST[index] = statement;
                }
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.FONT) {
                    currentFont = statement.value;
                    processAST[index] = statement;
                }
                if (statement.type === CodeKeyWord.TEXT) {
                    // text to image
                    awaitPromises.push(
                        new Promise((resolve) => {
                            let text = statement.text;
                            const renderDiv = document.createElement('div');
                            const mathFragments = Array.from(text.matchAll(/\$.*?\$/g));
                            for (let i = 0; i < mathFragments.length; ++i) {
                                let LaTeXString = '';

                                const lines = mathFragments[i][0].slice(1, -1).split('\\\\');
                                // split by LF
                                for (let j = 0; j < lines.length; ++j) {
                                    const content = lines[j];
                                    const LaTeXString = katex.renderToString(content, {
                                        strict: 'ignore',
                                        throwOnError: false,
                                        macros: LaTeXMacros
                                    });
                                    // render katex
                                    lines[j] = LaTeXString;
                                }
                                const content = lines.join('<br />');
                                LaTeXString = content;
                                text = text.replace(mathFragments[i][0], LaTeXString);
                            }
                            renderDiv.innerHTML = text;
                            renderDiv.style.color = currentColor;
                            renderDiv.style.font = currentFont;
                            renderDiv.style.fontSize = currentSize + 'px';
                            const renderX = parseInt((statement.method === CodeKeyWord.ABS
                                ? statement.x
                                : (statement.x * CanvasSize.width)).toString());
                            renderDiv.style.width = CanvasSize.width - renderX + 'px'; /* auto change into next line */

                            document.body.insertBefore(renderDiv, document.body.childNodes[0]);
                            setTimeout(() => {
                                html2png(renderDiv, {
                                    backgroundColor: null, // background transparent
                                    useCORS: true,
                                    logging: false
                                }, CanvasSize.width - renderX /* auto change into next line */).then(dataurl => {
                                    document.body.removeChild(renderDiv);
                                    calcSha256WithWorker(dataurl).then(sha256 => {
                                        const imageElement = new Image();
                                        imageElement.src = dataurl;
                                        imageElement.onload = () => {
                                            images[sha256] = dataurl;
                                            processAST[index] = {
                                                type: CodeKeyWord.IMAGE,
                                                image: sha256,
                                                x: statement.x,
                                                y: statement.y,
                                                method: statement.method,
                                                size: [CodeKeyWord.ABS, imageElement.width, imageElement.height]
                                            };
                                            resolve();
                                        };
                                        if (dataurl === 'data:,') {
                                            // cannot be loaded
                                            images[sha256] = dataurl;
                                            processAST[index] = {
                                                type: CodeKeyWord.IMAGE,
                                                image: sha256,
                                                x: statement.x,
                                                y: statement.y,
                                                method: statement.method,
                                                size: [CodeKeyWord.ABS, 0, 0]
                                            };
                                            resolve();
                                        }
                                    }).catch(console.error);
                                }).catch(console.error);
                            }, 50);
                        })
                    );
                }
                if (statement.type === CodeKeyWord.DRAW) processAST[index] = statement;
                if (statement.type === CodeKeyWord.IMAGE) processAST[index] = statement;
            }
        });
        if (isError) return;
        Promise.all(awaitPromises).then(async () => {
            processAST = processAST.filter(Boolean); // filter undefined
            process.env.NODE_ENV !== 'production' && console.log(processAST);
            const canvas = document.createElement('canvas');
            canvas.height = CanvasSize.height;
            canvas.width = CanvasSize.width;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const ctx = canvas.getContext('2d')!;
            for (let i = 0; i < processAST.length; ++i) {
                // console.log(processAST[i], i);
                await ((statement: typeof AST[number]) => {
                    return new Promise<void>(resolve => {
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
                                currentSize = statement.value;
                                ctx.font = `${currentSize} "${currentFont}"`;
                                ctx.lineWidth = currentSize;
                            } else if (statement.key === CodeKeyWord.FONT) {
                                currentFont = statement.value;
                                ctx.font = `${currentSize} "${currentFont}"`;
                            }
                            resolve();
                        } else if (statement.type === CodeKeyWord.DRAW) {
                            ctx.moveTo(
                                statement.from[0],
                                statement.from[1]
                            );
                            ctx.lineTo(
                                statement.to[0],
                                statement.to[1]
                            );
                            resolve();
                        } else if (statement.type === CodeKeyWord.IMAGE) {
                            const renderX = parseInt((statement.method === CodeKeyWord.ABS
                                ? statement.x
                                : (statement.x * canvas.width)).toString());
                            const renderY = parseInt((statement.method === CodeKeyWord.ABS
                                ? statement.y
                                : (statement.y * canvas.height)).toString());
                            const sizeWidth = parseInt((statement.size[0] === CodeKeyWord.ABS
                                ? statement.size[1]
                                : (statement.size[1] * canvas.width)).toString());
                            const sizeHeight = parseInt((statement.size[0] === CodeKeyWord.ABS
                                ? statement.size[2]
                                : (statement.size[2] * canvas.height)).toString());
                            const dataurl = images[statement.image] || '';
                            const img = new Image();
                            img.src = dataurl;
                            img.onload = () => {
                                ctx.drawImage(img, renderX, renderY, sizeWidth, sizeHeight);
                                resolve();
                            };
                            if (dataurl === 'data:,') return resolve();
                            // invalid image data
                        }
                    });
                })(processAST[i]);
            }
            if (isRenderWaterMark) {
                ctx.stroke();
                ctx.font = '42px "Noto Sans Light"';
                ctx.fillStyle = '#000000';
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.fillText(`Generated By ${(document.querySelector('.platform')! as HTMLElement || { innerText: '' }).innerText}`, canvas.width * 0.8, canvas.height * 0.98);
                const img = new Image();
                img.src = '/assets/logo.png';
                img.onload = () => {
                    ctx.drawImage(img, canvas.width * 0.8 - 140, canvas.height * 0.95, 128, 128);
                    resolve(canvas.toDataURL('image/png', 1));
                };
            } else {
                ctx.stroke();
                resolve(canvas.toDataURL('image/png', 1));
            }
        }).catch(console.error);
    });
}
