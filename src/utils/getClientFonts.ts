/* eslint-disable @typescript-eslint/no-explicit-any */
export type FontData = {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
    blob: () => Promise<Blob>;
};
export default new Promise<FontData[]>((resolve, reject) => {
    function queryLoop (): Promise<FontData[]> {
        return new Promise((resolve) => {
            (window as any).queryLocalFonts().then((result: FontData[]) => resolve(result)).catch(() => {
                setTimeout(() => {
                    queryLoop().then(resolve);
                }, 2000);
            });
        });
    }
    if (window && (window as any).queryLocalFonts) {
        return queryLoop().then(resolve);
    } else {
        alert('Your browser is out of date that it doesn\'t support queryLocalFonts api, please upgrade your browser to latest version.');
        reject(new Error('Browser is out of date.'));
    }
});
