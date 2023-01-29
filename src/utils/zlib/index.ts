import { DeflateFunctionOptions, Data } from 'pako';

// eslint-disable-next-line import/no-webpack-loader-syntax
import gzipWorker from 'worker-loader!./gzip.worker';

// eslint-disable-next-line import/no-webpack-loader-syntax
import ungzipWorker from 'worker-loader!./ungzip.worker';

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
