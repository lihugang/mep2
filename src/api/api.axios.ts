import Axios from 'axios';
const axios = Axios.create();
axios.defaults.timeout = 5000;
axios.defaults.baseURL = import.meta.env.PROD
    ? '/api/v1'
    : 'http://localhost:10399/api/v1'; // default dev-api-server port 10399
axios.interceptors.response.use((response) => {
    response.ok = response.data.ok;
    // extract response status from data
    response.data = response.data.data ?? response.data ?? '';
    // extract data
    return response;
}, (error) => {
    console.log(error);
    return Promise.reject(error);
});
export default axios;
