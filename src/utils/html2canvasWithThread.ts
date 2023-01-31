/* eslint-disable space-before-function-paren */
import { config } from '@/config';
import _html2canvas, { Options } from 'html2canvas';

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-explicit-any
const awaitMessageChannelEmpty = (arr: Array<any>) => new Promise<void>(async resolve => {
    while (arr.length) {
        await sleep(200);
    }
    resolve();
});

export default function html2canvasFactory(config: config) {
    const threadPool: Array<{
        window: Window | null,
        mq: Array<{
            content: string;
            size: string;
            color: string;
            font: string;
            width?: number;
            height?: number;
            options?: Partial<Options>;
        }> // message queue
    }> = [];
    if (config.experiments.renderThreadPool.enable) {
        console.log(threadPool);
        for (let i = 0; i < config.experiments.renderThreadPool.counts; ++i) {
            const openPath = `/experiments/renderThread?ts=${new Date().getTime()}&rand=${Math.random()}`;
            const openWindow = window.open(openPath, openPath, 'directories=no, fullscreen=no, height=1, left=0, location=no, menubar=no, resizable=no, scrollbars=no, status=no, titlebar=no, toolbar=no, top=0, width=1');
            threadPool.push({
                window: openWindow,
                mq: []
            });
            const id = threadPool.length - 1;
            openWindow && openWindow.addEventListener('close', () => {
                threadPool[id].window = null;
            });
        }
        if (threadPool.map(item => item.window).includes(null)) alert('Failed to pop render thread window, please allow them in your browser settings, and restart this page.');

        window.addEventListener('beforeunload', () => {
            threadPool.forEach(item => {
                item.window && item.window.close();
            });
        }); // close sub windows when main window exit
        function html2canvas(element: HTMLElement, options?: Partial<Options>, width?: number, height?: number): Promise<string> {
            const isLogging = (process.env.NODE_ENV === 'production')
                ? (options?.logging ?? false)
                : true;
            options && (options.logging = isLogging);
            // dev-env, log always true, production, log defaults to false

            const opsID = Math.random().toString(36).substring(3);

            return new Promise((resolve, reject) => {
                const aliveThreadPool = threadPool.filter(item => Boolean(item.window && !item.window.closed));
                if (isLogging) console.log(opsID, 'Alive thread counts', aliveThreadPool.length);
                if (aliveThreadPool.length) {
                    // has alive thread
                    let chooseThreadId = parseInt((Math.random() * aliveThreadPool.length).toString());
                    if (isLogging) console.log(opsID, 'Default thread', chooseThreadId);
                    // find free thread
                    for (let i = 0; i < aliveThreadPool.length; ++i) {
                        if (!aliveThreadPool[i].mq.length) {
                            chooseThreadId = i;
                            if (isLogging) console.log(opsID, 'Find free thread', chooseThreadId);
                            break;
                        }
                    }
                    console.log(opsID, aliveThreadPool[chooseThreadId]);
                    awaitMessageChannelEmpty(aliveThreadPool[chooseThreadId].mq).then(() => {
                        const thread = aliveThreadPool[chooseThreadId];
                        if (!thread.window) return reject(new Error('Thread has been destroyed.'));
                        thread.mq.push({
                            content: element.innerHTML,
                            size: element.style.fontSize,
                            font: element.style.fontFamily,
                            color: element.style.color,
                            width: width,
                            height: height,
                            options: options
                        });
                        if (isLogging) console.log(opsID, 'push to remote', thread.mq[0]);
                        thread.window.postMessage({
                            target: 'thread',
                            id: opsID,
                            ...thread.mq[0]
                        });
                        const onMessageReceive = (event: MessageEvent<{
                            data: string;
                            target: string;
                            id: string;
                        }>) => {
                            if (event.data.target === 'main' && event.data.id === opsID) {
                                thread.mq.shift();
                                console.log('Receive message from remote', event.data);
                                thread.window?.removeEventListener('message', onMessageReceive);
                                resolve(event.data.data);
                            }
                        };
                        window.addEventListener('message', onMessageReceive);
                    });
                } else {
                    _html2canvas(element, options).then(item => resolve(item.toDataURL('image/png'))).catch(reject);
                }
            });
        }
        return html2canvas;
    } else return (element: HTMLElement, options?: Partial<Options>) => _html2canvas(element, options).then(item => item.toDataURL('image/png'));
}
