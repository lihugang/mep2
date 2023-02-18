/* eslint-disable space-before-function-paren */
import type { CodeAST } from './AST.type';
import { CodeKeyWord, ParseCodeError, UnknownASTSymbolError } from './AST.type';

import { PreProcessComment } from './preprocess';

function AST2String(AST: CodeAST): string {
    const lines: string[] = [];
    AST.forEach((unit, index) => {
        index++;
        // index number starts from 1
        switch (unit.type) {
            case CodeKeyWord.SET:
                switch (unit.key) {
                    case CodeKeyWord.CANVAS:
                        lines.push(`set canvas ${unit.width} ${unit.height}`);
                        break;
                    case CodeKeyWord.COLOR:
                        lines.push(`set color ${unit.value}`);
                        break;
                    case CodeKeyWord.SIZE:
                        lines.push(`set size ${unit.value}`);
                        break;
                    case CodeKeyWord.FONT:
                        lines.push(`set font ${unit.value}`);
                        break;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    default: throw new UnknownASTSymbolError(index, 5, `set ${(unit as any).key}`);
                }
                break;
            case CodeKeyWord.LATEX_MACRO:
                lines.push(`macro ${unit.key} ${unit.value}`);
                break;
            case CodeKeyWord.TEXT:
                switch (unit.method) {
                    case CodeKeyWord.ABS:
                        lines.push(`text abs ${unit.x} ${unit.y} ${unit.text}`);
                        break;
                    case CodeKeyWord.RWD:
                        lines.push(`text rwd ${unit.x} ${unit.y} ${unit.text}`);
                        break;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    default: throw new UnknownASTSymbolError(index, 6, `text ${(unit as any).key}`);
                }
                break;
            case CodeKeyWord.IMAGE:
                switch (unit.method) {
                    case CodeKeyWord.ABS:
                        switch (unit.size[0]) {
                            case CodeKeyWord.ABS:
                                lines.push(`image abs ${unit.image} at ${unit.x} ${unit.y} resize abs ${unit.size[1]} ${unit.size[2]}`);
                                break;
                            case CodeKeyWord.RWD:
                                lines.push(`image abs ${unit.image} at ${unit.x} ${unit.y} resize rwd ${unit.size[1]} ${unit.size[2]}`);
                                break;
                            default: throw new UnknownASTSymbolError(
                                index,
                                `image abs ${unit.image} at ${unit.x} ${unit.y} resize `.length,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                `image abs ${unit.image} at ${unit.x} ${unit.y} resize ${(unit as any).size[0]}`
                            );
                        }
                        break;
                    case CodeKeyWord.RWD:
                        switch (unit.size[0]) {
                            case CodeKeyWord.ABS:
                                lines.push(`image rwd ${unit.image} at ${unit.x} ${unit.y} resize abs ${unit.size[1]} ${unit.size[2]}`);
                                break;
                            case CodeKeyWord.RWD:
                                lines.push(`image rwd ${unit.image} at ${unit.x} ${unit.y} resize rwd ${unit.size[1]} ${unit.size[2]}`);
                                break;
                            default: throw new UnknownASTSymbolError(
                                index,
                                `image rwd ${unit.image} at ${unit.x} ${unit.y} resize `.length,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                `image rwd ${unit.image} at ${unit.x} ${unit.y} resize ${(unit as any).size[0]}`
                            );
                        }
                        break;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    default: throw new UnknownASTSymbolError(index, 6, `image ${(unit as any).key}`);
                }
                break;
            case CodeKeyWord.DRAW:
                lines.push(`draw from ${unit.from[0]} ${unit.from[1]} to ${unit.to[0]} ${unit.to[1]}`);
                break;
            case CodeKeyWord.NULL:
                // ignore it
                break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            default: throw new UnknownASTSymbolError(index, 0, (unit as any).key);
        }
    });
    return lines.join('\n');
}

export { AST2String };
export { String2AST };

function getErrorColumn(tokens: string[], errorTokenIndex: number) {
    return tokens.slice(0, errorTokenIndex).join(' ').length + 2;
}

function String2AST(code: string): CodeAST {
    const ast: CodeAST = [];
    const statements = code.split('\n');
    statements.forEach((_statement, _lineNumber) => {
        const statement = PreProcessComment.removeComment(_statement), lineNumber = PreProcessComment.from(_statement).line || _lineNumber;
        const tokens = statement.trim().split(' ').filter(token => token !== '');
        if (tokens.length === 0) {
            ast.push({
                type: CodeKeyWord.NULL
            });
        }
        switch (tokens[0]) {
            case 'set':
                switch (tokens[1]) {
                    case 'canvas':
                        {
                            const width = parseInt(tokens[2]);
                            const height = parseInt(tokens[3]);
                            if (Number.isNaN(width)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: window.i18n.width_lc
                            }));
                            if (Number.isNaN(height)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 3), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: window.i18n.height_lc
                            }));

                            ast.push({
                                type: CodeKeyWord.SET,
                                key: CodeKeyWord.CANVAS,
                                width: width,
                                height: height
                            });
                        }
                        break;
                    case 'color':
                        ast.push({
                            type: CodeKeyWord.SET,
                            key: CodeKeyWord.COLOR,
                            value: tokens[2]
                        });
                        break;
                    case 'size':
                        {
                            const size = parseInt(tokens[2]);
                            if (Number.isNaN(size)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: window.i18n.size
                            }));

                            ast.push({
                                type: CodeKeyWord.SET,
                                key: CodeKeyWord.SIZE,
                                value: size
                            });
                        }
                        break;
                    case 'font':
                        ast.push({
                            type: CodeKeyWord.SET,
                            key: CodeKeyWord.FONT,
                            value: tokens.slice(2).join(' ')
                        });
                        break;
                    default: throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 1), statement, 'canvas | color | size | font');
                }
                break;
            case 'macro':
                ast.push({
                    type: CodeKeyWord.LATEX_MACRO,
                    key: tokens[1],
                    value: tokens[2]
                });
                break;
            case 'text':
                if (typeof tokens[1] === 'number') {
                    // ignore render method, default abs
                    tokens.splice(1, 0, 'abs');
                }
                switch (tokens[1]) {
                    case 'abs':
                        {
                            const x = parseInt(tokens[2]);
                            const y = parseInt(tokens[3]);
                            if (Number.isNaN(x)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: 'x'
                            }));
                            if (Number.isNaN(y)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: 'y'
                            }));

                            ast.push({
                                type: CodeKeyWord.TEXT,
                                method: CodeKeyWord.ABS,
                                x: x,
                                y: y,
                                text: tokens.slice(4).join(' ')
                            });
                        }
                        break;
                    case 'rwd':
                        {
                            const x = parseFloat(tokens[2]);
                            const y = parseFloat(tokens[3]);
                            if (Number.isNaN(x)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_float_between_0_and_1', {
                                name: 'x'
                            }));
                            if (Number.isNaN(y)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_float_between_0_and_1', {
                                name: 'y'
                            }));

                            ast.push({
                                type: CodeKeyWord.TEXT,
                                method: CodeKeyWord.RWD,
                                x: x,
                                y: y,
                                text: tokens.slice(4).join(' ')
                            });
                        }
                        break;
                    default: throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 1), statement, 'abs | rwd');
                }
                break;
            case 'image':
                if (tokens.length === 2) {
                    // image sha256
                    ast.push({
                        type: CodeKeyWord.IMAGE,
                        method: CodeKeyWord.ABS,
                        x: 0,
                        y: 0,
                        size: [CodeKeyWord.RWD, 1, 1], // full screen
                        image: tokens[2]
                    });
                } else if (tokens.length === 6) {
                    // image sha256 resize abs x y
                    // image sha256 resize rwd x y

                    let isSolved = false;

                    if (tokens[3] === 'resize') {
                        if (tokens[4] === 'abs') {
                            const width = parseInt(tokens[5]);
                            const height = parseInt(tokens[6]);
                            if (Number.isNaN(width)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 5), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: window.i18n.width_lc
                            }));
                            if (Number.isNaN(height)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 6), statement, window.i18n.template('x_is_a_positive_integer', {
                                name: window.i18n.height_lc
                            }));
                            ast.push({
                                type: CodeKeyWord.IMAGE,
                                method: CodeKeyWord.ABS,
                                x: 0,
                                y: 0,
                                size: [CodeKeyWord.ABS, width, height],
                                image: tokens[2]
                            });
                            isSolved = true;
                        } else if (tokens[4] === 'rwd') {
                            const width = parseFloat(tokens[5]);
                            const height = parseFloat(tokens[6]);
                            if (Number.isNaN(width)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 5), statement, window.i18n.template('x_is_a_float_between_0_and_1', {
                                name: window.i18n.width_lc
                            }));
                            if (Number.isNaN(height)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 6), statement, window.i18n.template('x_is_a_float_between_0_and_1', {
                                name: window.i18n.width_lc
                            }));
                            ast.push({
                                type: CodeKeyWord.IMAGE,
                                method: CodeKeyWord.ABS,
                                x: 0,
                                y: 0,
                                size: [CodeKeyWord.RWD, width, height],
                                image: tokens[2]
                            });
                            isSolved = true;
                        }
                    }

                    if (!isSolved) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.overload_error_please_read_the_documentation);
                } else if (tokens.length === 10) {
                    // image abs/rwd sha256 at x y resize abs/rwd w h
                    const method = (tokens[1] === 'abs')
                        ? CodeKeyWord.ABS
                        : (
                            (tokens[1] === 'rwd') ? CodeKeyWord.RWD : -1
                        );
                    if (method === -1) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 1), statement, 'abs | rwd');
                    const sha256 = tokens[2];
                    if (tokens[3] !== 'at') throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 3), statement, 'at');
                    const x = parseFloat(tokens[4]);
                    const y = parseFloat(tokens[5]);
                    if (Number.isNaN(x)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 4), statement, window.i18n.template('x_is_a_number', {
                        name: 'x'
                    }));
                    if (Number.isNaN(y)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 5), statement, window.i18n.template('x_is_a_number', {
                        name: 'y'
                    }));
                    if (tokens[6] !== 'resize') throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 6), statement, 'resize');
                    const sizeMethod = (tokens[7] === 'abs')
                        ? CodeKeyWord.ABS
                        : (
                            (tokens[7] === 'rwd') ? CodeKeyWord.RWD : -1
                        );
                    const width = parseFloat(tokens[8]);
                    const height = parseFloat(tokens[9]);
                    if (Number.isNaN(width)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 8), statement, window.i18n.template('x_is_a_number', {
                        name: window.i18n.width_lc
                    }));
                    if (Number.isNaN(height)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 9), statement, window.i18n.template('x_is_a_number', {
                        name: window.i18n.height_lc
                    }));
                    ast.push({
                        type: CodeKeyWord.IMAGE,
                        method: method,
                        x: x,
                        y: y,
                        size: [sizeMethod, width, height],
                        image: sha256
                    });
                } else throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.overload_error_please_read_the_documentation);

                break;

            case 'draw':
                {
                    if (tokens[1] !== 'from') throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, 'from');
                    const sx = parseInt(tokens[2]);
                    const sy = parseInt(tokens[3]);
                    const dx = parseInt(tokens[5]);
                    const dy = parseInt(tokens[6]);
                    if (Number.isNaN(sx)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 2), statement, window.i18n.template('x_is_a_positive_integer', {
                        name: 'sx'
                    }));
                    if (Number.isNaN(sy)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 3), statement, window.i18n.template('x_is_a_positive_integer', {
                        name: 'sy'
                    }));
                    if (tokens[4] !== 'to') throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 5), statement, 'to');
                    if (Number.isNaN(dx)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 4), statement, window.i18n.template('x_is_a_positive_integer', {
                        name: 'dx'
                    }));
                    if (Number.isNaN(dy)) throw new ParseCodeError(lineNumber, getErrorColumn(tokens, 5), statement, window.i18n.template('x_is_a_positive_integer', {
                        name: 'dy'
                    }));
                    ast.push({
                        type: CodeKeyWord.DRAW,
                        from: [sx, sy],
                        to: [dx, dy]
                    });
                }
                break;
            case '\n':
            case '':
                ast.push({
                    type: CodeKeyWord.NULL
                });
                break;
            default:
                // I don't know why case'' doesn't work
                if (statement.replaceAll(' ', '').length) {
                    throw new UnknownASTSymbolError(lineNumber, 1, statement, 'set | macro | text | draw | image');
                }
        }
    });
    return ast;
}
