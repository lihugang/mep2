import axios from './api.axios';
export default function updateHistoryRecord (filepath: string) {
    return new Promise<void>((resolve, reject) => {
        axios.post('/history', {
            filepath: filepath
        }).then(() => resolve()).catch((err: unknown) => {
            reject(err);
            console.error(err);
        });
    });
}
