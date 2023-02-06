import Worker from './calcSha256.worker?worker';
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
