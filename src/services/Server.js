const log4js = require('log4js');
const log = log4js.getLogger('server');

const fs = require('fs');
const http = require('http');
// const https = require('https');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const errorhandler = require('errorhandler');
const oasTools = require('oas-tools');
const jsyaml = require('js-yaml');
const {IpDeniedError, IpFilter} = require('express-ipfilter');

const basicAuthUsername = process.env.BASIC_AUTH_USERNAME || false;
const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD || false;

class Server {
    constructor() {
        /*
        const options = {
            key: fs.readFileSync('/path/to/key.pem'),
            cert: fs.readFileSync('/path/to/cert.pem'),
        };
        */

        this.port = process.env.PORT || 3000;
        this.app = express();
        this.app.set('port', this.port);
        this.app.use(bodyParser.json({strict: false, limit: '10mb'}));
        this.app.use(compression());
        if (process.env.IPFILTERING && process.env.IPFILTERING.length > 0) {
            const ips = process.env.IPFILTERING.split(',');
            this.app.use(IpFilter(ips, {mode: 'allow'}));
        }

        this.httpServer = http.createServer(this.app);
        // this.httpsServer = https.createServer(options, this.app);

        if (process.env.NODE_ENV !== 'production') {
            this.app.use(errorhandler());
        } else {
            this.app.use((err, req, res, next) => {
                if (err instanceof IpDeniedError) {
                    res.status(401).end('Forbidden');
                } else {
                    const status = err.status || 500;
                    if (process.env.NODE_ENV !== 'production') {
                        log.error('Request Error', err);
                        res.status(status).end(err.message);
                    } else {
                        res.status(status).end();
                    }
                }
            });
        }

        this.clientPath = path.join(process.cwd(), 'client', 'build');
        this.indexPage = path.join(this.clientPath, 'index.html');

        // REACT APP
        const maxAge = 60 * 60 * 1000; // 1 hour
        this.app.use(express.static(this.clientPath, {maxAge}));
        this.app.use((req, res, next) => {
            const enabledPaths = ['api', 'api-docs', 'docs'];
            if (!enabledPaths.includes(req.url.split('/')[1])) {
                res.sendFile(this.indexPage);
            } else {
                next();
            }
        });

        // SWAGGER
        const spec = fs.readFileSync(path.join(process.cwd(), 'api.yaml'), 'utf8');
        this.oasDoc = jsyaml.safeLoad(spec);

        const swaggerLogger = log4js.getLogger('swagger');
        swaggerLogger.warning = swaggerLogger.warn;

        this.options_object = {
            controllers: path.join(process.cwd(), 'src', 'controllers'),
            customLogger: swaggerLogger,
            strict: false,
            router: true,
            validator: true,
            docs: {
                apiDocs: '/api-docs',
                apiDocsPrefix: '',
                swaggerUi: '/docs',
                swaggerUiPrefix: '',
            },
            oasSecurity: true,
            securityFile: {
                BasicAuth: (req, secDef, token, next) => {
                    let auth = req.headers.authorization || req.headers.Authorization;
                    if (auth && auth.replace) {
                        auth = auth.replace(/^[b|B]asic\s/, '');
                        const base64 = Buffer.from(`${basicAuthUsername}:${basicAuthPassword}`, 'utf8').toString('base64');
                        if (basicAuthUsername && basicAuthPassword && auth === base64) {
                            return next();
                        }
                    }
                    return req.res.status(403).send({error: true, code: 403, message: `invalid credentials`});
                }
            }
        };

        oasTools.configure(this.options_object);
        oasTools.initialize(this.oasDoc, this.app, (error) => {
            if (error) {
                log.error(error);
            } else {
                log.info('OAS initialized');
            }
        });
        // END SWAGGER
    }

    /**
     * Static method to return the same instance
     */
    static INSTANCE() {
        if (!Server.instance) {
            Server.instance = new Server();
        }

        return Server.instance;
    }

    run() {
        this.httpServer.listen(this.port, () => {
            log.info(`App running at localhost:${this.port}`);
            if (this.options_object.docs !== false) {
                log.info(`API docs (Swagger UI) available on localhost:${this.port}/docs`);
            }
        });
    }

    getHttpServer() {
        return this.httpServer;
    }

    getApp() {
        return this.app;
    }
}

module.exports = Server;
