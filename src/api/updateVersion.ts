import axios from './api.axios';
import { AxiosResponse } from 'axios';
export type updateVersion = AxiosResponse<never>;
export default (): Promise<AxiosResponse<updateVersion>> => {
    return axios.post('/updateSoftwareFromServer');
};
