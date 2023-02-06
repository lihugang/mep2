import axios from './api.axios';
import type { config } from '@/config';
export default function updateConfig (config: config) {
    return new Promise<void>((resolve, reject) => {
        axios.post('/config', {
            config
        }).then(() => resolve()).catch((err: unknown) => {
            reject(err);
            console.error(err);
        });
    });
}
