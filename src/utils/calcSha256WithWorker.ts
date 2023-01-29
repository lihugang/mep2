// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./calcSha256.worker';
export default function calcSha256WithWorker (s: string) {
    return new Promise<string>((resolve) => {
        const worker = new Worker();
        worker.postMessage(s);
        worker.addEventListener('message', data => {
            worker.terminate();
            resolve(data.data);
        });
    });
}
