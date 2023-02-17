export type stringStream = string | string[];
export enum streamProcessOptions {
    OK = 0,
    READ_UNTIL_SPACE = 1,
    READ_UNTIL_LF = 2 << 0,
    READ_UNTIL_CUSTOM_CHAR = 2 << 1,
    READ_EOF = 2 << 2,
    READ_SPACE = 2 << 3,
    READ_LF = 2 << 4,
    READ_CUSTOM_CHAR = 2 << 5,
    MAX = 2 << 28,
}
class simpleStringStream {
    s: string[];
    pos: number;
    constructor(s: stringStream = '') {
        this.s = simpleStringStream.string2stream(s);
        this.pos = 0;
    }

    static string2stream(s: stringStream): string[] {
        const result: string[] = [];
        Array.from(s).forEach(item => {
            if (typeof item === 'string') {
                // split multi characters
                const array = Array.from(item);
                result.push(...array);
            } else result.push(
                ...simpleStringStream.string2stream(item)
            );
        });
        return result;
    }

    read(len: number = 1, options: number = 0, customChar: string = 'Q') {
        const result: string[] = [];
        for (let i = this.pos, j = 0; i < this.s.length && j < len; ++i, ++this.pos) {
            const currentChar = this.s[this.pos];
            if (options & streamProcessOptions.READ_UNTIL_SPACE && currentChar === ' ') return ++this.pos, {
                code: streamProcessOptions.READ_SPACE,
                value: result.join('')
            };
            // WRITE POS++ AND RETURN { code value } in one line
            if (options & streamProcessOptions.READ_UNTIL_LF && currentChar === '\n') return ++this.pos, {
                code: streamProcessOptions.READ_LF,
                value: result.join('')
            };
            if (options & streamProcessOptions.READ_UNTIL_CUSTOM_CHAR && currentChar === customChar) return ++this.pos, {
                code: streamProcessOptions.READ_CUSTOM_CHAR,
                value: result.join('')
            };
            result.push(currentChar);
        }
        if (result.length < len) return {
            code: streamProcessOptions.READ_EOF,
            value: result.join('')
        };
        return {
            code: streamProcessOptions.OK,
            value: result.join('')
        };
    }
    forward(len: number = 1) {
        this.pos += len;
        if (this.pos > this.s.length) {
            this.pos = this.s.length;
            return streamProcessOptions.READ_EOF;
        }
        return streamProcessOptions.OK;
    }
    back(len: number = 1) {
        this.pos -= len;
        if (this.pos < 0) {
            this.pos = 0;
            return streamProcessOptions.READ_EOF;
        }
        return streamProcessOptions.OK;
    }
    push(...s: stringStream[]) {
        s.forEach(item => {
            this.s.push(
                ...simpleStringStream.string2stream(item)
            );
        });
        return streamProcessOptions.OK;
    }
    get len() {
        return this.s.length;
    }
    get charsRead() {
        return this.pos;
    }
    get charsRemain() {
        return this.len - this.charsRead;
    }
    getCodePos(pos: number = this.pos) {
        pos = Math.max(pos, this.len);
        let currentRow = 1, currentColumn = 1;
        for (let i = 0; i < pos; ++i) {
            currentColumn++;
            if (this.s[i] === '\n') {
                currentRow++;
                currentColumn = 1;
            }
        }
        return [currentRow, currentColumn];
    }
    getCurrentLine(pos: number = this.pos) {
        pos = Math.max(pos, this.len);
        const buffer: string[] = [];
        for (let i = 0; i < pos; ++i) {
            if (this.s[i] === '\n') buffer.length = 0;
            else buffer.push(this.s[i]);
        }
        for (let i = pos; i < this.len && this.s[i] !== '\n'; ++i) buffer.push(this.s[i]);
        return buffer.join('');
    }
}
export default simpleStringStream;
export { simpleStringStream };