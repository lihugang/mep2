/* eslint-disable space-before-function-paren */
import type { ColorHex, rangeInImage, sha256 } from '@/utils/ProjectManager';
export enum CodeKeyWord {
    SET,
    TEXT,
    IMAGE,
    COLOR,
    SIZE,
    FONT,
    LATEX_MACRO,
    DRAW,
    ABS,
    RWD,
    CANVAS,
    NULL
}

export type CodeSetColor = {
    type: CodeKeyWord.SET,
    key: CodeKeyWord.COLOR,
    value: ColorHex
}
export type CodeSetFontSize = {
    type: CodeKeyWord.SET,
    key: CodeKeyWord.SIZE,
    value: number
}
export type CodeSetFontFamily = {
    type: CodeKeyWord.SET,
    key: CodeKeyWord.FONT,
    value: string
}
export type CodeSetCanvas = {
    type: CodeKeyWord.SET,
    key: CodeKeyWord.CANVAS,
    width: number;
    height: number;
}
export type CodeSetPattern = CodeSetColor | CodeSetFontSize | CodeSetFontFamily | CodeSetCanvas;

export type CodeLaTeXMacroPattern = {
    type: CodeKeyWord.LATEX_MACRO,
    key: string;
    value: string;
};

export type CodePutTextAbsolute = {
    type: CodeKeyWord.TEXT,
    method: CodeKeyWord.ABS,
    x: number;
    y: number;
    text: string;
}
export type CodePutTextResponsive = {
    type: CodeKeyWord.TEXT,
    method: CodeKeyWord.RWD,
    x: rangeInImage,
    y: rangeInImage,
    text: string;
}
export type CodePutText = CodePutTextAbsolute | CodePutTextResponsive;

export type CodePutImageAbsolute = {
    type: CodeKeyWord.IMAGE,
    method: CodeKeyWord.ABS,
    x: number;
    y: number;
    size: [CodeKeyWord.ABS, number, number] | [CodeKeyWord.RWD, number, number];
    image: sha256;
}
export type CodePutImageResponsive = {
    type: CodeKeyWord.IMAGE,
    method: CodeKeyWord.RWD,
    x: number;
    y: number;
    size: [CodeKeyWord.ABS, number, number] | [CodeKeyWord.RWD, number, number];
    image: sha256;
}
export type CodePutImage = CodePutImageAbsolute | CodePutImageResponsive;

export type CodeDraw = {
    type: CodeKeyWord.DRAW,
    from: [number, number],
    to: [number, number]
}

export type CodeAST = (CodeSetPattern | CodeLaTeXMacroPattern | CodePutText | CodePutImage | CodeDraw | {
    type: CodeKeyWord.NULL
})[];

export class ParseCodeError extends SyntaxError {
    row: number;
    column: number;
    context: string;
    expect?: string;
    constructor(row: number, column: number, context: string, expect?: string) {
        super();
        this.row = row;
        this.column = column;
        this.context = context;
        this.expect = expect;
    }

    getErrorName() {
        return window.i18n.parsing_code_error;
    }

    getErrorMessage() {
        return `${window.i18n.template('syntax_error_at', {
            row: this.row,
            column: this.column
        })}\n${this.getErrorName()}\n${window.i18n.context}:\n${this.context.toString()}\n${this.expect ? `${window.i18n.expect} ${this.expect}` : ''}`;
    }
}

export class UnknownASTSymbolError extends ParseCodeError {
    getErrorName() {
        return window.i18n.unknown_ast_symbol_error;
    }
}
