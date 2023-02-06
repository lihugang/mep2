/* eslint-disable space-before-function-paren */
import type { i18nMap } from '@/i18n';
import * as Monaco from 'monaco-editor';
import type { Project, Page } from '../ProjectManager';
import type { Ref } from 'vue';
import { ParseCodeError, CodeKeyWord } from './AST.type';
import type { config } from '@/config';

export function registerLanguage() {
    Monaco.languages.register({
        id: 'mep@2-script'
    });
}

export function highlightLanguage() {
    Monaco.languages.setMonarchTokensProvider('mep@2-script', {
        setSC: ['color', 'canvas', 'font', 'size'],
        tokenizer: {
            root: [
                [/set/, { token: 'command', next: '@setSC' }],
                [/text/, { token: 'command', next: '@textLocation' }],
                [/macro/, { token: 'command', next: '@macro' }],
                [/draw/, { token: 'command', next: '@draw' }],
                [/image/, { token: 'command', next: '@image' }]
            ],

            setSC: [
                [/color/, { token: 'subcommand', next: '@color' }],
                [/canvas/, { token: 'subcommand', next: '@canvas' }],
                [/font/, { token: 'subcommand', next: '@font' }],
                [/size/, { token: 'subcommand', next: '@size' }]
            ],
            color: [[/#?[0-9a-f]{6}/, { token: 'color', next: '@popall' }]],
            canvas: [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@popall' }]],
            font: [[/.*/, { token: 'font', next: '@popall' }]],
            size: [[/[1-9]{1}[0-9]*/, { token: 'size', next: '@popall' }]],

            textLocation: [[/abs/, { token: 'abs', next: '@text-abs' }], [/rwd/, { token: 'rwd', next: '@text-rwd' }]],
            'text-abs': [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@text' }]],
            'text-rwd': [[/[0-9]+\s[0-9]+/, { token: 'warning', next: '@popall' }], [/[0-1]{1}\s[0-1]{1}/, { token: 'pos', next: '@text' }], [/0\.[0-9]*\s0\.[0-9]*/, { token: 'pos', next: '@text' }]],
            text: [[/.*/, { token: 'string', next: '@popall' }]],

            macro: [[/\s[0-9A-Za-z\\{}[\]()]*/, { token: 'macro-key', next: '@macro-value' }]],
            'macro-value': [[/\s[0-9A-Za-z\\{}[\]()]*/, { token: 'macro-value', next: '@popall' }]],

            draw: [[/from/, { token: 'subcommand', next: '@draw-from' }]],
            'draw-from': [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@draw-to-key' }]],
            'draw-to-key': [[/to/, { token: 'subcommand', next: '@draw-to' }]],
            'draw-to': [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@popall' }]],

            image: [
                [/[a-z0-9]{64}/, { token: 'string', next: '@image-resize' }], /* sha256 */
                [/abs/, { token: 'abs', next: '@image-sha256-abs' }],
                [/rwd/, { token: 'rwd', next: '@image-sha256-rwd' }]
            ],
            'image-sha256-abs': [[/[a-z0-9]{64}/, { token: 'string', next: '@image-at-abs' }]],
            'image-sha256-rwd': [[/[a-z0-9]{64}/, { token: 'string', next: '@image-at-rwd' }]],
            'image-at-abs': [[/at/, { token: 'subcommand', next: '@image-location-abs' }]],
            'image-at-rwd': [[/at/, { token: 'subcommand', next: '@image-location-rwd' }]],
            'image-location-abs': [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@image-resize' }]],
            'image-location-rwd': [[/[0-9]+\s[0-9]+/, { token: 'warning', next: '@image-resize' }], [/[0-1]{1}\s[0-1]{1}/, { token: 'pos', next: '@image-resize' }], [/0\.[0-9]*\s0\.[0-9]*/, { token: 'pos', next: '@image-resize' }]],
            'image-resize': [[/resize/, { token: 'subcommand', next: 'image-resize-method' }]],
            'image-resize-method': [[/abs/, { token: 'abs', next: '@image-resize-abs' }], [/rwd/, { token: 'rwd', next: '@image-resize-rwd' }]],
            'image-resize-abs': [[/[0-9]+\s[0-9]+/, { token: 'pos', next: '@popall' }]],
            'image-resize-rwd': [[/[0-9]+\s[0-9]+/, { token: 'warning', next: '@popall' }], [/[0-1]{1}\s[0-1]{1}/, { token: 'pos', next: '@popall' }], [/0\.[0-9]*\s0\.[0-9]*/, { token: 'pos', next: '@popall' }]]
        }
    });
    Monaco.editor.defineTheme('custom-highlight', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'command', foreground: '663399' },
            { token: 'subcommand', foreground: 'da70d6' },
            { token: 'color', foreground: '191970' },
            { token: 'pos', foreground: '00bfff' },
            { token: 'font', foreground: 'b8860b' },
            { token: 'size', foreground: '556bbf' },
            { token: 'error', foreground: 'ff0000' },
            { token: 'warning', foreground: 'ff9900' },
            { token: 'abs', foreground: '228b22' },
            { token: 'rwd', foreground: '32cd32' },
            { token: 'macro-key', foreground: '90e0e4' },
            { token: 'macro-value', foreground: '4e8d90' }
        ],
        colors: {}
    });
}

export function autoComplete(clientFonts: string[], i18n: i18nMap, project: Ref<Project>) {
    Monaco.languages.registerCompletionItemProvider('mep@2-script', {
        provideCompletionItems: (model, pos) => {
            const statement = model.getLineContent(pos.lineNumber).split(' ');
            const suggestions: Monaco.languages.CompletionItem[] = [];
            if (statement.length === 1) {
                // input commands
                const commands = ['set', 'macro', 'text', 'draw', 'image'];
                suggestions.push(...commands.map(item => {
                    return {
                        label: item,
                        insertText: item,
                        kind: Monaco.languages.CompletionItemKind.Module
                    } as Monaco.languages.CompletionItem;
                }));
            }
            if (statement[0] === 'set') {
                if (statement.length === 2) {
                    const subcommands = ['canvas', 'color', 'size', 'font'];
                    suggestions.push(...subcommands.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Unit
                        } as Monaco.languages.CompletionItem;
                    }));
                }
                if (statement[1] === 'font') {
                    suggestions.push(...clientFonts.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Enum
                        } as Monaco.languages.CompletionItem;
                    }));
                }
                if (statement[1] === 'color') {
                    const color = [[i18n.pink, '#ffc0cb'], [i18n.orchid, 'da70d6'], [i18n.magenta, '#ff00ff'], [i18n.purple, '#800080'], [i18n.indigo, '#4b0082'], [i18n.medium_slate_blue, '#7b68ee'], [i18n.lavender, '#e6e6fa'], [i18n.blue, '#0000ff'], [i18n.cornflower_blue, '#6495ed'], [i18n.light_skyblue, '#87cefa'], [i18n.skyblue, '#86ceeb'], [i18n.azure, '#f0ffff'], [i18n.cyan, '#00ffff'], [i18n.aqua, '#00ffff'], [i18n.turquoise, '#40e0d0'], [i18n.auqamarin, '#7fffaa'], [i18n.light_green, '#90ee90'], [i18n.lime_green, '#32cd32'], [i18n.lime, '#00ff00'], [i18n.green, '#008000'], [i18n.dark_green, '#006400'], [i18n.green_yellow, '#adff2f'], [i18n.beige, '#f5f5dc'], [i18n.yellow, '#ffff00'], [i18n.gold, '#ffd700'], [i18n.wheat, '#f5deb3'], [i18n.orange, '#ffa500'], [i18n.dark_orange, '#ff8c00'], [i18n.chocolate, '#d2691e'], [i18n.tomato, '#ff6347'], [i18n.snow, '#fffafa'], [i18n.red, '#ff0000'], [i18n.white, '#ffffff'], [i18n.white_smoke, '#f5f5f5'], [i18n.light_gray, '#d3d3d3'], [i18n.gray, '#a9a9a9'], [i18n.black, '#000000']];
                    suggestions.push(...color.map(item => {
                        return {
                            label: item[0],
                            insertText: item[1],
                            kind: Monaco.languages.CompletionItemKind.Color
                        } as Monaco.languages.CompletionItem;
                    }));
                }
            }
            if (statement[0] === 'text') {
                if (statement.length === 2) {
                    const methods = ['abs', 'rwd'];
                    suggestions.push(...methods.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Unit
                        } as Monaco.languages.CompletionItem;
                    }));
                }
            }
            if (statement[0] === 'draw') {
                if (statement.length === 2) {
                    suggestions.push({
                        label: 'from',
                        insertText: 'from',
                        kind: Monaco.languages.CompletionItemKind.Keyword
                    } as Monaco.languages.CompletionItem);
                }
                if (statement.length === 5) {
                    suggestions.push({
                        label: 'to',
                        insertText: 'to',
                        kind: Monaco.languages.CompletionItemKind.Keyword
                    } as Monaco.languages.CompletionItem);
                }
            }
            if (statement[0] === 'image') {
                if (statement.length === 2) {
                    const images = [];
                    let imageSha256: keyof typeof project.value.images = '';
                    for (imageSha256 in project.value.images) {
                        images.push(imageSha256);
                    }
                    suggestions.push(...images.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Field
                        } as Monaco.languages.CompletionItem;
                    }));
                    const methods = ['abs', 'rwd'];
                    suggestions.push(...methods.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Method
                        } as Monaco.languages.CompletionItem;
                    }));
                }
                if (statement.length === 3 && (statement[1] === 'abs' || statement[1] === 'rwd')) {
                    const images = [];
                    let imageSha256: keyof typeof project.value.images = '';
                    for (imageSha256 in project.value.images) {
                        images.push(imageSha256);
                    }
                    suggestions.push(...images.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Field
                        } as Monaco.languages.CompletionItem;
                    }));
                }
                if (statement.length === 3 && statement[1] !== 'abs' && statement[1] !== 'rwd') {
                    // image sha256 resize abs x x
                    suggestions.push({
                        label: 'resize',
                        insertText: 'resize',
                        kind: Monaco.languages.CompletionItemKind.Operator
                    } as Monaco.languages.CompletionItem);
                }
                if (statement.length === 4 && statement[1] !== 'abs' && statement[1] !== 'rwd' && statement[2] === 'resize') {
                    const methods = ['abs', 'rwd'];
                    suggestions.push(...methods.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Method
                        } as Monaco.languages.CompletionItem;
                    }));
                }
                if (statement.length === 4 && (statement[1] === 'abs' || statement[1] === 'rwd')) {
                    suggestions.push({
                        label: 'at',
                        insertText: 'at',
                        kind: Monaco.languages.CompletionItemKind.Operator
                    } as Monaco.languages.CompletionItem);
                }
                if (statement.length === 7 && (statement[1] === 'abs' || statement[1] === 'rwd')) {
                    suggestions.push({
                        label: 'resize',
                        insertText: 'resize',
                        kind: Monaco.languages.CompletionItemKind.Operator
                    } as Monaco.languages.CompletionItem);
                }
                if (statement.length === 8 && statement[6] === 'resize') {
                    const methods = ['abs', 'rwd'];
                    suggestions.push(...methods.map(item => {
                        return {
                            label: item,
                            insertText: item,
                            kind: Monaco.languages.CompletionItemKind.Method
                        } as Monaco.languages.CompletionItem;
                    }));
                }
            }
            return {
                suggestions
            };
        }
    });

    Monaco.languages.registerCompletionItemProvider('mep@2-script', {
        triggerCharacters: ['\\'],
        provideCompletionItems: () => {
            const suggestions: Monaco.languages.CompletionItem[] = [];
            const macros = [[i18n.m_next_line, '\\'], [i18n.m_because, 'because'], [i18n.m_therefore, 'therefore'], [i18n.m_pm, 'pm'], [i18n.m_frac, 'frac'], [i18n.m_times, 'times'], [i18n.m_triangle, 'triangle'], [i18n.m_cong, 'cong'], [i18n.m_Delta, 'Delta'], [i18n.m_delta, 'delta'], [i18n.m_sqrt, 'sqrt'], [i18n.m_sim, 'sim'], [i18n.m_prime, 'prime'], [i18n.m_circ, 'circ'], [i18n.m_log, 'log'], [i18n.m_sum, 'sum'], [i18n.m_prod, 'prod'], [i18n.m_lim, 'lim'], [i18n.m_int, 'int'], [i18n.m_mp, 'mp'], [i18n.m_equiv, 'equiv'], [i18n.m_ne, 'ne'], [i18n.m_leftarrow, 'leftarrow'], [i18n.m_rightarrow, 'rightarrow'], [i18n.m_long_leftarrow, 'longleftarrow'], [i18n.m_long_rightarrow, 'longrightarrow'], [i18n.m_ge, 'ge'], [i18n.m_le, 'le'], [i18n.m_approx, 'approx'], [i18n.m_pi, 'pi'], [i18n.m_alpha, 'alpha'], [i18n.m_beta, 'beta'], [i18n.m_gamma, 'gamma'], [i18n.m_theta, 'theta'], [i18n.m_rho, 'rho'], [i18n.m_lambda, 'lambda'], [i18n.m_mu, 'mu'], [i18n.m_xi, 'xi'], [i18n.m_omega, 'omega'], [i18n.m_phi, 'phi'], [i18n.m_epsilon, 'epsilon'], [i18n.m_sin, 'sin'], [i18n.m_cos, 'cos'], [i18n.m_cot, 'cot'], [i18n.m_tan, 'tan'], [i18n.m_dot, 'cdot'], [i18n.m_angle, 'angle'], [i18n.m_perp, 'perp'], [i18n.m_cup, 'cup'], [i18n.m_cap, 'cap'], [i18n.m_subset, 'subset'], [i18n.m_subseteq, 'subseteq'], [i18n.m_subsetneq, 'subsetneq'], [i18n.m_supset, 'supset'], [i18n.m_supseteq, 'supseteq'], [i18n.m_supsetneq, 'supsetneq'], [i18n.m_div, 'div'], [i18n.m_odot, 'odot'], [i18n.m_varnothing, 'varnothing'], [i18n.m_in, 'in'], [i18n.m_notin, 'notin'], [i18n.m_choose, 'choose'], [i18n.m_plus, '\b+'], [i18n.m_minus, '\b-'], [i18n.m_equal, '\b='], [i18n.m_greater_than, '\b>'], [i18n.m_less_than, '\b<'], [i18n.m_superscript, '\b^'], [i18n.m_subscript, '\b_']];
            suggestions.push(...macros.map(item => {
                return {
                    label: item[0],
                    insertText: item[1],
                    kind: Monaco.languages.CompletionItemKind.Snippet
                } as Monaco.languages.CompletionItem;
            }));
            return {
                suggestions
            };
        }
    });
}

export function generateMark(page: Page, code: string, clientFonts: string[], images: {
    [index: string]: string
}, onCompileError: (e: ParseCodeError) => void) {
    const markers: Monaco.editor.IMarkerData[] = [];
    try {
        page.codeString = code;
    } catch (e) {
        if (e instanceof ParseCodeError) {
            markers.push({
                startLineNumber: e.row,
                endLineNumber: e.row,
                startColumn: e.column,
                endColumn: 100,
                severity: Monaco.MarkerSeverity.Error,
                message: e.getErrorMessage()
            });
            onCompileError(e);
        }
    }
    const AST = page.AST;
    const canvasSize = {
        height: 2304,
        width: 4096
    };
    AST.forEach((statement, index) => {
        // check some runtime errors but no syntax errors
        index++; // index starts from 1
        try {
            if (index === 1) {
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.CANVAS) {
                    if (statement.height < 0) {
                        markers.push({
                            startLineNumber: 1,
                            endLineNumber: 1,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Error,
                            message: 'The canvas height must be a positive integer.'
                        });
                    }
                    if (statement.width < 0) {
                        markers.push({
                            startLineNumber: 1,
                            endLineNumber: 1,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Error,
                            message: 'The canvas width must be a positive integer.'
                        });
                    }
                    // the first line must be setting canvas size
                    canvasSize.height = statement.height;
                    canvasSize.width = statement.width;
                } else {
                    markers.push({
                        startLineNumber: 1,
                        endLineNumber: 1,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Error,
                        message: 'The first line must be "set canvas xxx xxx"'
                    });
                }
            } else {
                if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.CANVAS) {
                    // otherwise the first line, the following setting canvas should be ignored
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: 'This statement will be ignored.'
                    });
                }
            }
            if (statement.type === CodeKeyWord.TEXT || statement.type === CodeKeyWord.IMAGE) {
                if (statement.method === CodeKeyWord.ABS) {
                    if (statement.x < 0 || statement.x > canvasSize.width) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: `The location width should be in range 0-${canvasSize.width}`
                        });
                    }
                    if (statement.y < 0 || statement.y > canvasSize.height) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: `The location height should be in range 0-${canvasSize.height}`
                        });
                    }
                } else {
                    if (statement.x < 0 || statement.x > 1) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: 'The location width should be in range 0-1'
                        });
                    }
                    if (statement.y < 0 || statement.y > 1) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: 'The location height should be in range 0-1'
                        });
                    }
                }
            }
            if (statement.type === CodeKeyWord.IMAGE) {
                if (!Object.keys(images).includes(statement.image)) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `Cannot locate image ${statement.image}`
                    });
                }
                if (statement.size[0] === CodeKeyWord.ABS) {
                    if (statement.size[1] < 0 || statement.size[1] > canvasSize.width) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: `The size width should be in range 0-${canvasSize.width}`
                        });
                    }
                    if (statement.size[2] < 0 || statement.size[2] > canvasSize.height) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: `The size height should be in range 0-${canvasSize.height}`
                        });
                    }
                } else {
                    if (statement.size[1] < 0 || statement.size[1] > 1) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: 'The size width should be in range 0-1'
                        });
                    }
                    if (statement.size[2] < 0 || statement.size[2] > 1) {
                        markers.push({
                            startLineNumber: index,
                            endLineNumber: index,
                            startColumn: 0,
                            endColumn: 100,
                            severity: Monaco.MarkerSeverity.Warning,
                            message: 'The size height should be in range 0-1'
                        });
                    }
                }
            }
            if (statement.type === CodeKeyWord.DRAW) {
                if (statement.from[0] < 0 || statement.from[0] > canvasSize.width) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `The starting location width should be in range 0-${canvasSize.width}`
                    });
                }
                if (statement.from[1] < 0 || statement.from[1] > canvasSize.height) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `The starting location height should be in range 0-${canvasSize.height}`
                    });
                }
                if (statement.to[0] < 0 || statement.to[0] > canvasSize.width) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `The ending location width should be in range 0-${canvasSize.width}`
                    });
                }
                if (statement.to[1] < 0 || statement.to[1] > canvasSize.height) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `The ending location height should be in range 0-${canvasSize.height}`
                    });
                }
            }
            if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.SIZE) {
                if (statement.value <= 0) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Error,
                        message: 'The font size must be a positive integer.'
                    });
                }
            }
            if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.COLOR) {
                if (!statement.value.match(/^#?[a-f0-9]{6}$/)) {
                    console.log(statement.value);
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: 'The color must be a hexadecimal string with six characters.'
                    });
                }
            }
            if (statement.type === CodeKeyWord.SET && statement.key === CodeKeyWord.FONT) {
                if (!clientFonts.includes(statement.value)) {
                    markers.push({
                        startLineNumber: index,
                        endLineNumber: index,
                        startColumn: 0,
                        endColumn: 100,
                        severity: Monaco.MarkerSeverity.Warning,
                        message: `We couldn't find font "${statement.value}" in your computer.`
                    });
                }
            }
        } catch { /* catch */ }
    });
    return markers;
}

export function registerSnippets(snippets: config['snippets']) {
    Monaco.languages.registerCompletionItemProvider('mep@2-script', {
        provideCompletionItems() {
            return {
                suggestions: snippets.map(item => {
                    return {
                        label: item.text,
                        insertText: item.code,
                        kind: Monaco.languages.CompletionItemKind.Snippet
                    } as Monaco.languages.CompletionItem;
                })
            };
        }
    });
}
