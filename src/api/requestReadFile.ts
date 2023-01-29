export default (filepath: string) => fetch(
    (
        (process.env.NODE_ENV === 'production')
            ? '/api/v1'
            : 'http://localhost:10399/api/v1'
    ) + `/openFile?path=${encodeURIComponent(filepath)}`
).then(response => response.blob());
