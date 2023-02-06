import type { DeflateFunctionOptions, Data } from 'pako';

import gzipWorker from './gzip.worker?worker';

import ungzipWorker from './ungzip.worker?worker';

// eslint-disable-next-line space-before-function-paren
export function gzip(data: Data | string, options?: DeflateFunctionOptions): Promise<Uint8Array> {
    return new Promise((resolve) => {
        // eslint-disable-next-line new-cap
        const worker = new gzipWorker();
        worker.postMessage([data, options]);
        worker.addEventListener('message', e => {
            worker.terminate();
            resolve(e.data);
        });
    });
}

// eslint-disable-next-line space-before-function-paren
export function ungzip(data: Data | string, options?: DeflateFunctionOptions): Promise<Uint8Array> {
    return new Promise((resolve) => {
        // eslint-disable-next-line new-cap
        const worker = new ungzipWorker();
        worker.postMessage([data, options]);
        worker.addEventListener('message', e => {
            worker.terminate();
            resolve(e.data);
        });
    });
}
