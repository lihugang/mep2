import axios from './api.axios';
import type { AxiosResponse } from 'axios';
export type historyRecord = AxiosResponse<string[]>;
export default new Promise<string[]>((resolve, reject) => {
    axios.get('/history').then((data) => {
        resolve(data.data);
    }).catch((err: unknown) => {
        reject(err);
        console.error(err);
    });
});
