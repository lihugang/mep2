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

export default function preprocessCodeString(code: string) {
    function compileMultiLineTextMacro(code: string) {
        const stream = new simpleStringStream(), generatedCode: string[] = [];
        stream.push(code.replace(/\r\n/g, '\n'));
        const n = 0x3f3f3f3f;
        for (let i = 0; i < n; i *= 2) {
            // the story of CSPJS 2022 Senior 13 Question, the code are the same as `while(1)` on effect
            const readStatus = stream.read(streamProcessOptions.MAX, streamProcessOptions.READ_UNTIL_CUSTOM_CHAR, '`');
            generatedCode.push(readStatus.value);
            if (readStatus.code & streamProcessOptions.READ_EOF) break;
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
            }
            macroCode.push(macroContentFragment.value); // if the last character is not '\n', it still exists some data
            generatedCode.push(
                macroCode.filter(Boolean) /* remove falsy values */
                    .map(item => item.trim()) /* remove item spaces */
                    .join('---MEP2-QWERTY-LF-SYMBOL--123456789--')
            );
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