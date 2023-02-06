import * as express from 'express';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as pathLib from 'path';
import * as os from 'os';
import * as download from 'download';
import fetch from 'node-fetch';

export default function startServer(config: {
    port: number
}, destroyElectron: () => void, dialog: (str: string) => void) {
    const app = express();
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.set('json spaces', 4);
    app.disable('X-Powered-By');

    app.use('/api/v1', (() => {
        const router = express.Router();
        router.all('*', (req, res, next) => {
            res.set('access-control-allow-origin', 'http://localhost:8080').set('access-control-allow-method', 'GET, POST, OPTIONS').set('access-control-allow-headers', 'content-type, content-length').set('access-control-max-age', (0x3f3f3f3f).toString());
            if (req.method === 'OPTIONS') return res.status(204).json({});

            router.get('/config', (req, res) => {
                const config = {
                    fontFamily: 'Noto Sans Light',
                    language: 'en-US',
                    editor: {
                        color: '#ff0000',
                        fontSize: 60
                    },
                    snippets: [],
                    experiments: {
                        renderThreadPool: {
                            enable: false,
                            counts: 2
                        }
                    }
                };
                try {
                    const userConfig = JSON.parse(fs.readFileSync(pathLib.join(os.homedir(), '.mep2rc')).toString());
                    _.merge(config, userConfig);
                } catch { }
                res.status(200).json({
                    ok: true,
                    data: config
                });
            });

            router.post('/config', (req, res) => {
                fs.writeFileSync(pathLib.join(os.homedir(), '.mep2rc'), JSON.stringify(req.body.config));
                res.status(201).json({
                    ok: true
                });
            });

            router.get('/isElectron', (req, res) => {
                res.status(200).json({
                    ok: true,
                    data: true
                });
            });

            router.get('/currentVersion', (req, res) => {
                res.status(200).json({
                    ok: true,
                    data: [2, 0, 1]
                });
            });

            router.get('/history', (req, res) => {
                let history: string[] = [];
                try {
                    history = JSON.parse(fs.readFileSync(pathLib.join(os.homedir(), '.mep2-history')).toString());
                } catch { }
                res.status(200).json({
                    ok: true,
                    data: history.filter(Boolean)
                });
            });

            router.post('/history', (req, res) => {
                let history: string[] = [];
                try {
                    history = JSON.parse(fs.readFileSync(pathLib.join(os.homedir(), '.mep2-history')).toString());
                } catch { }
                history.unshift(req.body.filepath);
                history = [...new Set(history)];
                if (history.length > 5) history.pop();
                fs.writeFileSync(pathLib.join(os.homedir(), '.mep2-history'), JSON.stringify(history));
                res.status(201).json({
                    ok: true
                });
            });

            router.get('/openFile', (req, res) => {
                const path = decodeURIComponent((req.query.path || '').toString());
                if (fs.existsSync(path) && fs.statSync(path).isFile()) {
                    res.status(200);
                    fs.createReadStream(path).pipe(res);
                } else {
                    res.status(404);
                    res.send('404 not found');
                }
            });

            router.post('/updateSoftwareFromServer', async (req, res) => {
                const tmpDirectoryName = 'mep2-latest-installer-' + crypto.randomBytes(2).toString('hex');
                const tmpPath = pathLib.join(os.tmpdir(), tmpDirectoryName);
                try {
                    fs.mkdirSync(tmpPath);
                } catch { }
                const tmpFilename = pathLib.join(tmpPath, 'mep2-latest');
                const writeStream = fs.createWriteStream(tmpFilename, {
                    autoClose: true
                });
                let filename = 'mep2-latest-installer';
                try {
                    filename = await (await fetch(`https://mep2.deta.dev/latest.filename?platform=${process.platform}&arch=${process.arch}`)).text();
                } catch {
                    dialog('Failed to connect to download server, please visit please visit https://mep2.deta.dev/download to download and install it manually.');
                }
                const downloadStream = download(`https://mep2.deta.dev/latest?platform=${process.platform}&arch=${process.arch}`);
                downloadStream.pipe(writeStream);
                downloadStream.catch(() => {
                    dialog('Failed to download the latest installer, please visit https://mep2.deta.dev/download to download and install it manually.');
                    destroyElectron();
                });
                writeStream.on('close', () => {
                    const writeStream = fs.createWriteStream(pathLib.join(os.homedir(), filename), {
                        autoClose: true
                    });
                    fs.createReadStream(tmpFilename).pipe(writeStream);
                    writeStream.on('close', () => {
                        dialog(`The latest installer is downloaded at ${pathLib.join(os.homedir(), filename)}, please install it manually.`);
                        destroyElectron();
                    });
                });

                res.status(202).json({
                    ok: 1
                });
            });

            next();
        });

        return router;
    })());

    app.all('*', (req, res) => {
        const path = process.argv.indexOf('--app-debug') === -1 ? `resources/app/resources${req.path}` /* Electron Pack */ : `resources${req.path}`;/* Debug Mode */
        if (fs.existsSync(path) && fs.statSync(path).isFile()) {
            const contentType = path.endsWith('.html')
                ? 'text/html; charset=utf-8'
                : path.endsWith('.js')
                    ? 'application/javascript; charset=utf-8'
                    : path.endsWith('.css')
                        ? 'text/css; charset=utf-8'
                        : path.endsWith('.txt')
                            ? 'text/plain; charset=utf-8'
                            : path.endsWith('.json')
                                ? 'application/json; charset=utf-8'
                                : path.endsWith('.svg')
                                    ? 'image/svg+xml'
                                    : path.endsWith('.png')
                                        ? 'image/png'
                                        : path.endsWith('.ttf')
                                            ? 'fonts/ttf'
                                            : path.endsWith('.pdf')
                                                ? 'application/pdf'
                                                : path.endsWith('.webmanifest')
                                                    ? 'application/manifest+json'
                                                    : 'application/octet-stream';
            if (req.headers['accept-encoding']?.includes('br')) {
                if (fs.existsSync(path + '.br') && fs.statSync(path + '.br').isFile()) {
                    res.set('content-encoding', 'br').set('content-type', contentType).set('cache-control', 'public, max-age=86400');
                    fs.createReadStream(path + '.br').pipe(res);
                    return;
                }
            }
            if (req.headers['accept-encoding']?.includes('gzip')) {
                if (fs.existsSync(path + '.gz') && fs.statSync(path + '.gz').isFile()) {
                    res.set('content-encoding', 'gzip').set('content-type', contentType).set('cache-control', 'public, max-age=86400');
                    fs.createReadStream(path + '.gz').pipe(res);
                    return;
                }
            }
            res.set('content-type', contentType).set('cache-control', 'public, max-age=86400');
            fs.createReadStream(path).pipe(res);
        } else {
            // file not exists, fallback to index.html
            const indexPath = process.argv.indexOf('--app-debug') === -1 ? 'resources/app/resources/index.html' /* Electron Pack */ : 'resources/index.html';/* Debug Mode */
            const content = fs.readFileSync(indexPath).toString();
            const sha256 = crypto.createHash('sha256').update(content).digest('hex');
            if (req.headers['If-None-Match'] === sha256) {
                return res.status(304).send('');
            }
            res.set('content-type', 'text/html; charset=utf-8');
            res.set('etag', sha256);
            res.send(content);
        }
    });

    app.listen(config.port);
    console.log('Server is listening on', config.port);
}

if (process.argv.indexOf('--entry') !== -1) {
    const config = JSON.parse(fs.readFileSync('config.json').toString());
    startServer(config, () => process.exit(0), console.log);
}
