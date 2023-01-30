import * as express from 'express';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.set('json spaces', 4);
app.disable('X-Powered-By');
const config = JSON.parse(fs.readFileSync('config.json').toString());

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
                snippets: []
            };
            try {
                const userConfig = JSON.parse(req.cookies.config);
                _.merge(config, userConfig);
            } catch { }
            res.status(200).json({
                ok: true,
                data: config
            });
        });

        router.post('/config', (req, res) => {
            res.cookie('config', JSON.stringify(req.body.config));
            res.status(201).json({
                ok: true
            });
        });

        router.get('/isElectron', (req, res) => {
            res.status(200).json({
                ok: true,
                data: false
            });
        });

        router.get('/currentVersion', (req, res) => {
            res.status(200).json({
                ok: true,
                data: [2, 0, 0]
            });
        });

        router.get('/history', (req, res) => {
            res.status(200).json({
                ok: true,
                data: []
            });
        });

        next();
    });

    return router;
})());

app.all('*', (req, res) => {
    const path = `resources${req.path}`;
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
        const content = fs.readFileSync('resources/index.html').toString();
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
