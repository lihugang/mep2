import axios from './api.axios';
import rawAxios, { AxiosResponse } from 'axios';
export type version = AxiosResponse<[number, number, number]>;
export default {
    localVersion: new Promise<version['data']>((resolve, reject) => {
        axios.get('/currentVersion').then((data) => {
            resolve(data.data);
        }).catch((err: unknown) => {
            reject(err);
            console.error(err);
        });
    }),
    latestVersion: new Promise<version['data']>((resolve, reject) => {
        rawAxios.get('https://mep2.deta.dev/latest.version').then((data) => {
            resolve(data.data.split('.').map((item: string) => parseInt(item)));
        }).catch((err: unknown) => {
            reject(err);
            console.error(err);
        });
    })
};
