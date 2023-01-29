import axios from './api.axios';
import { AxiosResponse } from 'axios';
export type isElectron = AxiosResponse<boolean>;
export default new Promise<boolean>((resolve, reject) => {
    axios.get('/isElectron').then((data) => {
        resolve(data.data);
    }).catch((err: unknown) => {
        reject(err);
        console.error(err);
    });
});
