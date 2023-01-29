import * as pako from 'pako';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;
ctx.addEventListener('message', (e) => {
    const data = e.data;
    ctx.postMessage(
        pako.gzip(data[0], data[1])
    );
});
