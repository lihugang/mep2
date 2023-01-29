import sha256 from 'sha256';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;
ctx.addEventListener('message', (e) => {
    const data = e.data;
    ctx.postMessage(sha256(data));
});
