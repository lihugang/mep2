import simpleStringStream from '../simpleStringStream';
import { streamProcessOptions } from '../simpleStringStream';
import { ParseCodeError } from './AST.type';

export class PreProcessCodeError extends ParseCodeError {
    getErrorName(): string {
        return window.i18n.pre_process_code_error;
    }
}
export class UnfinishedMultiLineStringMacro extends PreProcessCodeError {
    getErrorName(): string {
        return window.i18n.unfinishing_multi_line_string_macro;
    }
}

export class PreProcessComment { // add comment in pre process to tell the compile where the source code is, make it easier to locate error
    line: number = 0;
    setLineNumber(line: number) {
        this.line = line;
        return this;
    }
    toString() {
        return `~~~MEP2~~COMPILE~COMMENT~${JSON.stringify({
            line: this.line
        })}~~\n`;
    }
    static from(code: string) {
        try {
            const pos = code.indexOf('~~~MEP2~~COMPILE~COMMENT~');
            const jsonString = code.slice(pos + '~~~MEP2~~COMPILE~COMMENT~'.length, -2);
            const json = JSON.parse(jsonString);
            const commentInstance = new PreProcessComment();
            if (json.line) commentInstance.line = json.line;
            return commentInstance;
        } catch {
            return new PreProcessComment();
        }
    }
    static removeComment(code: string) {
        const pos = code.indexOf('~~~MEP2~~COMPILE~COMMENT~');
        if (pos !== -1)
            return code.substring(0, pos);
        else return code;
    }
}

export default function preprocessCodeString(code: string) {
    function compileMultiLineTextMacro(code: string) {
        const stream = new simpleStringStream(), generatedCode: string[] = [];
        stream.push(code.replace(/\r\n/g, '\n'));
        const n = 0x3f3f3f3f;
        let currentLine = 1;
        for (let i = 0; i < n; i *= 2) {
            // the story of CSPJS 2022 Senior 13 Question, the code are the same as `while(1)` on effect

            for (let j = 0; j < n; j *= 2) {
                const readStatus = stream.read(streamProcessOptions.MAX, streamProcessOptions.READ_UNTIL_CUSTOM_CHAR | streamProcessOptions.READ_UNTIL_LF, '`');
                generatedCode.push(readStatus.value);
                if (readStatus.code & streamProcessOptions.READ_LF || readStatus.code & streamProcessOptions.READ_EOF) {
                    // read LF or read EOF, mark source code position
                    generatedCode.push((
                        new PreProcessComment()
                    ).setLineNumber(currentLine).toString());
                    currentLine++;
                }
                if (readStatus.code & streamProcessOptions.READ_EOF) break;
                if (readStatus.code & streamProcessOptions.READ_CUSTOM_CHAR) break; // miss '`', macro flag
            }
            if (stream.ended) break;
            const getMacroStatus = stream.read(streamProcessOptions.MAX, streamProcessOptions.READ_UNTIL_CUSTOM_CHAR, '`');
            if (getMacroStatus.code & streamProcessOptions.READ_EOF) {
                const errorPosition = stream.getCodePos();
                throw new UnfinishedMultiLineStringMacro(
                    errorPosition[0], errorPosition[1], stream.getCurrentLine(), 'The single string "`"'
                );
            }
            const macroContent = getMacroStatus.value;
            const macroInlineStream = new simpleStringStream(macroContent);
            const macroCode: string[] = [];
            let macroContentFragment: ReturnType<typeof macroInlineStream.read>;
            while ((macroContentFragment = macroInlineStream.read(
                streamProcessOptions.MAX,
                streamProcessOptions.READ_UNTIL_LF /* read one line content */
            )), !(macroContentFragment.code & streamProcessOptions.READ_EOF) /* when read eof, terminate the repeat */) {
                macroCode.push(macroContentFragment.value);
                currentLine++;
            }
            macroCode.push(macroContentFragment.value); // if the last character is not '\n', it still exists some data
            generatedCode.push(
                macroCode.filter(Boolean) /* remove falsy values */
                    .map(item => item.trim()) /* remove item spaces */
                    .join('---MEP2-QWERTY-LF-SYMBOL--123456789--')
            );
            generatedCode.push((
                new PreProcessComment()
            ).setLineNumber(currentLine).toString());
            currentLine++;
        }
        const generatedCodeWithCustomLFSymbol = generatedCode.join('').split('---MEP2-QWERTY-LF-SYMBOL--123456789--');
        let isInMathMode = false;
        const result: string[] = [];
        for (let i = 0; i < generatedCodeWithCustomLFSymbol.length; ++i) {
            const s = generatedCodeWithCustomLFSymbol[i];
            for (let j = 0; j < s.length; ++j) {
                if (s[j] === '$') isInMathMode = !isInMathMode;
            }
            result.push(s);
            if (i === generatedCodeWithCustomLFSymbol.length - 1) break;  /* not process the LF in the last line */
            if (isInMathMode) result.push('\\\\');
            else result.push('$\\\\$'); // convert into math mode
        }
        return result.join('');
    }
    return compileMultiLineTextMacro(code);
}

export { preprocessCodeString };