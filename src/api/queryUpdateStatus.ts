import axios from './api.axios';
import type { AxiosResponse } from 'axios';
export type queryUpdateStatus = AxiosResponse<boolean>;
export default function queryUpdateStatus() {
    return new Promise<boolean>((resolve, reject) => {
        axios.get('/queryUpdateStatus').then((data) => {
            resolve(data.data);
        }).catch((err: unknown) => {
            reject(err);
            console.error(err);
        });
    });
}