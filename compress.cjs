/* eslint-disable no-undef */
const f = require('fs');
const p = require('path');
const z = require('zlib');
console.log('--Compressing---');
const e = (a) => {
    f.readdirSync(a).forEach(i => {
        if (i.endsWith('.gz') || i.endsWith('.br')) return;
        const t = p.join(a, i);
        if (f.statSync(t).isFile()) {
            const s = new Date().getTime();
            f.createReadStream(t).pipe(z.createGzip({
                level: 9
            })).pipe(f.createWriteStream(t + '.gz')).on('close', () => {
                f.createReadStream(t).pipe(z.createBrotliCompress({
                    params: {
                        [z.constants.BROTLI_PARAM_QUALITY]: 11
                    }
                })).pipe(f.createWriteStream(t + '.br')).on('close', () => {
                    console.log(`${t} raw: ${r(f.statSync(t).size)}  |  gzip: ${r(f.statSync(t + '.gz').size)}  |  brotil: ${r(f.statSync(t + '.br').size)}  |  time: ${new Date().getTime() - s}ms`);
                });
            });
        } else e(t);
    });
};
const r = (s) => {
    if (s < 1024) return s.toFixed(2) + ' B';
    if (s < 1024 * 1024) return (s / 1024).toFixed(2) + ' kB';
};
e('dist');