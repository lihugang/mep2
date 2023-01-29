import axios from 'axios';
declare module 'axios' {
    interface AxiosResponse<T> {
        ok: boolean;
        data: T;
    }
}