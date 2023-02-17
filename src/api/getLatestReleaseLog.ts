import rawAxios from 'axios';
import type { AxiosResponse } from 'axios';
import type { config } from '@/config';
export type releaseLog = AxiosResponse<string>;
export default (lang: config['language']) => new Promise<releaseLog>((resolve) => {
    rawAxios.get(`https://mep2.lihugang.top/latest.releaseLog?lang=${lang}`).then(resolve).catch((err: unknown) => resolve({
        data: `Failed to get release log.\n${err}`
    } as releaseLog));
});
