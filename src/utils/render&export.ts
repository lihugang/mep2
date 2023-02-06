import type { Project } from './ProjectManager';
import renderImage from './renderImage';
import { PDFDocument } from 'pdf-lib';
// eslint-disable-next-line camelcase
import type { Options as h2c_Options } from 'html2canvas';

const getTimeFormat = () => {
    return new Date(
        new Date().getTime() - (new Date().getTimezoneOffset()) * 1000 * 60 // times second(60) and ms(1000)
        // process timezone
    ).toISOString().slice(0, -1);
    // display local time, not iso time, remove zero flag
};

const loadImage = (dataurl: string) => {
    return new Promise<HTMLImageElement>((resolve) => {
        const img = document.createElement('img');
        img.src = dataurl;
        img.onload = () => {
            resolve(img);
        };
    });
};

// eslint-disable-next-line space-before-function-paren, camelcase
export default function render(project: Project, pageID: number, isRenderAllPages: boolean, isExportImages: boolean, isRenderWatermark: boolean, html2png: (element: HTMLElement, options?: Partial<h2c_Options> | undefined, width?: number) => Promise<string>, setProgress?: (progress: number) => void) {
    if (!isRenderAllPages) {
        const page = project.pages[pageID - 1];
        renderImage(page.AST, project.images, page.getLaTeXMacros(), isRenderWatermark, html2png).then((dataurl: string) => {
            setProgress && setProgress(80);
            if (isExportImages) {
                fetch(dataurl)
                    .then(response => response.blob())
                    .then(blob => {
                        setProgress && setProgress(100);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.download = `${project.filename} - ${getTimeFormat()} - Page${pageID}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                    });
            } else {
                (async () => {
                    const image = await loadImage(dataurl);
                    const doc = await PDFDocument.create();
                    const page = doc.addPage([image.width, image.height]);
                    const imagePDF = await doc.embedPng(dataurl);
                    page.drawImage(imagePDF, {
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height
                    });
                    const pdfData = await doc.save();
                    setProgress && setProgress(100);
                    const blob = new Blob([pdfData], {
                        type: 'application/pdf'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.download = `${project.filename} - ${getTimeFormat()} - Page${pageID}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                })();
            }
        });
    } else if (isRenderAllPages && !isExportImages) {
        (async () => {
            const doc = await PDFDocument.create();
            for (let i = 0; i < project.pages.length; ++i) {
                const page = project.pages[i];
                const dataurl = await renderImage(
                    page.AST,
                    project.images,
                    page.getLaTeXMacros(),
                    isRenderWatermark,
                    html2png
                );
                const image = await loadImage(dataurl);
                const pdfPage = doc.addPage([image.width, image.height]);
                const imagePDF = await doc.embedPng(dataurl);
                pdfPage.drawImage(imagePDF, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height
                });
                setProgress && setProgress(parseInt((i / project.pages.length * 100).toString()));
            }
            const pdfData = await doc.save();
            setProgress && setProgress(100);
            const blob = new Blob([pdfData], {
                type: 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.download = `${project.filename} - ${getTimeFormat()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        })();
    } else if (isRenderAllPages && isExportImages) {
        (async () => {
            const renderDiv = document.createElement('div');
            let maxWidth = -1;
            for (let i = 0; i < project.pages.length; ++i) {
                const page = project.pages[i];
                const dataurl = await renderImage(
                    page.AST,
                    project.images,
                    page.getLaTeXMacros(),
                    isRenderWatermark,
                    html2png
                );
                const image = await loadImage(dataurl);
                maxWidth = Math.max(maxWidth, image.width);
                renderDiv.appendChild(image);
                renderDiv.appendChild(document.createElement('br'));
                setProgress && setProgress(parseInt((i / project.pages.length * 100).toString()));
            }
            document.body.insertBefore(renderDiv, document.body.childNodes[0]);
            const dataurl = await html2png(renderDiv, {}, maxWidth);
            document.body.removeChild(renderDiv);
            setProgress && setProgress(100);
            fetch(dataurl)
                .then(response => response.blob())
                .then(blob => {
                    setProgress && setProgress(100);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.download = `${project.filename} - ${getTimeFormat()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                });
        })();
    }
}
