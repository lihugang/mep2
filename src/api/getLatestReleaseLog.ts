import rawAxios, { AxiosResponse } from 'axios';
import { config } from '@/config';
export type releaseLog = AxiosResponse<string>;
export default (lang: config['language']) => new Promise<releaseLog>((resolve) => {
    rawAxios.get(`https://mep2.deta.dev/latest.releaseLog?lang=${lang}`).then(resolve).catch((err: unknown) => resolve({
        data: `Failed to get release log.\n${err}`
    } as releaseLog));
});
