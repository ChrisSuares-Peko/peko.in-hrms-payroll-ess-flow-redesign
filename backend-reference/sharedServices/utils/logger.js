/* eslint-disable no-unused-vars */
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const { decode } = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const LokiTransport = require('winston-loki');
const cluster = require('cluster');
const process = require('process');

const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

const { Client: ElasticsearchClient } = require('@elastic/elasticsearch');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Strips circular refs and known-noisy Node internals from log payloads so Logtail / Elasticsearch / Loki
// transports don't drop entries. Raw req/res, axios errors, and Sequelize instances are all cyclic.
const SAFE_STRIP_KEYS = new Set([
    'socket', '_httpMessage', 'parser',
    '_readableState', '_writableState', '_events', '_eventsCount',
    'rawHeaders', 'rawTrailers',
]);

const safeSerialize = (value, seen = new WeakSet(), depth = 0) => {
    if (depth > 8) return '[MaxDepth]';
    if (value === null || value === undefined) return value;
    const t = typeof value;
    if (t === 'function') return '[Function]';
    if (t !== 'object') return value;
    if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack };
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return '[Buffer]';
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) {
        return value.map((item) => safeSerialize(item, seen, depth + 1));
    }
    const out = {};
    for (const key of Object.keys(value)) {
        if (SAFE_STRIP_KEYS.has(key)) {
            out[key] = '[Stripped]';
            continue;
        }
        try {
            out[key] = safeSerialize(value[key], seen, depth + 1);
        } catch (e) {
            out[key] = '[Unserializable]';
        }
    }
    return out;
};

const safeStringify = (value) => {
    try {
        return JSON.stringify(safeSerialize(value));
    } catch (e) {
        return '[Unserializable]';
    }
};

const sanitizeForTransport = format((info) => {
    if (info && typeof info === 'object') {
        if (info.message && typeof info.message === 'object') {
            info.message = safeSerialize(info.message);
        }
        if (info.metadata && typeof info.metadata === 'object') {
            info.metadata = safeSerialize(info.metadata);
        }
    }
    return info;
});

// Helper functions for sanitizing and masking sensitive data
const sanitizeSensitiveFields = (message) => {
    if (typeof message === 'string') {
        try {
            message = JSON.parse(message);
        } catch (e) {
            // Not a JSON string, use as-is
        }
    }
    if (!message?.request?.reqBody) return message;
    message.request.reqBody = maskJSON(message.request.reqBody);
    return JSON.stringify(message);
};

function maskJSON(jsonObj) {
    const longFields = new Map([
        ['logo', true],
        ['recaptchaToken', true],
        ['orgIdLogo', true],
    ]);

    if (typeof jsonObj === 'object' && jsonObj !== null) {
        if (Array.isArray(jsonObj)) {
            return jsonObj.map((item) => maskJSON(item));
        } else {
            const maskedObj = {};
            for (const key in jsonObj) {
                if (longFields.has(key)) {
                    maskedObj[key] = 'true';
                } else if (
                    Object.prototype.hasOwnProperty.call(jsonObj, key) &&
                    (key?.toLowerCase() === 'password' ||
                        key?.toLowerCase()?.includes('password'))
                ) {
                    maskedObj[key] = '*'.repeat(jsonObj[key].length);
                } else {
                    maskedObj[key] = maskJSON(jsonObj[key]);
                }
            }
            return maskedObj;
        }
    } else if (typeof jsonObj === 'string') {
        return jsonObj;
    } else {
        return jsonObj;
    }
}

const getApplicantId = (authHeader) => {
    if (authHeader && authHeader.startsWith('Bearer')) {
        const token = authHeader.split(' ')[1];
        const decodedToken = decode(token);
        return decodedToken.uid;
    }
    return null;
};

const conditionalMessageStructure = (level, metadata, message) => {
    try {
        if (level === 'info') {
            return sanitizeSensitiveFields(message);
        }
        if (level === 'error') {
            const { req } = metadata;
            if (req) {
                return {
                    body: sanitizeSensitiveFields({
                        request: {
                            httpMethod: req.method,
                            reqURL: req.originalUrl,
                            ...(req.method !== 'GET' ? { reqBody: { ...req.body } } : {}),
                            pathParams: { ...req.params },
                            queryParams: { ...req.query },
                            clientIpAddress:
                                req.headers['x-forwarded-for'] ||
                                req.connection?.remoteAddress ||
                                req?.ips,
                            deviceInfo: req.headers['user-agent'],
                            ...(req.headers.authorization ? { jwtToken: true } : {}),
                            ...(req.sessionId ? { sessionId: true } : {}),
                        },
                    }),
                    error: (typeof metadata?.error === 'string'
                        ? metadata.error
                        : metadata?.error?.message || metadata?.error?.messages || '')
                        ?.split('\n')?.[0] || message?.split('\n')[0],
                };
            }
            const errorText = typeof metadata?.error === 'string'
                ? metadata.error
                : metadata?.error?.message || metadata?.error?.messages || '';
            return {
                error: errorText?.split('\n')?.[0] || message?.split('\n')[0],
            };
        }
    } catch (err) {
        console.error(err);

        return '';
    }
};

const getModuleName = (url) => {
    try {
        if (!url) return '';
        if (url && typeof url === 'string') {
            return "Payment";
        }
    } catch (err) {
        return '';
    }
};

function logJsonFormat(level, metadata, message) {
    const jsonResponse = {
        level: level,
        traceId: metadata?.traceId || uuidv4(),
        moduleName: getModuleName(metadata.req?.originalUrl),
        logType: metadata?.logType,
        error: metadata.stack?.split('\n')[0],
        location:
            (metadata?.trace?.[0].file.includes('internal/modules/cjs/loader.js') ? metadata?.error?.requireStack?.[0] : metadata?.trace?.[0].file) ||
            metadata.stack?.split('\n')[1]?.trim()?.split(':')[1],
        line:
            metadata.stack?.split('\n')[1]?.trim()?.split(':')[2] ||
            metadata.stack?.split('\n')?.[0].split(':')[2],
        message: conditionalMessageStructure(level, metadata, message),
        service_name: metadata.service,
        tag: 'PEKO.SHAREDSERVICES',
        partnerId: metadata?.partnerId || null,
        applicant_id: getApplicantId(metadata.req?.headers?.authorization),
        meta_data: {
            error: metadata.error,
            stack: metadata.stack,
            timestamp: metadata.timestamp,
            trace: metadata.trace,
        },
        version: 1,
        '@timestamp': metadata.timestamp,
    };
    return jsonResponse;
}

let esTransport;

if (process.env.ELASTICSEARCH_NODE && process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
    // Create Elasticsearch client
    const esClient = new ElasticsearchClient({
        node: process.env.ELASTICSEARCH_NODE,
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
        },
    });

    // Configure Elasticsearch transport options
    const esTransportOpts = {
        client: esClient,
        indexPrefix: 'payment-logs',
        transformer: (logData) => ({
            '@timestamp': logData.timestamp,
            message: JSON.stringify(logData.message),
            severity: logData.level,
            fields: logData.meta,
        }),
        onError: (error) => {
            console.error('Elasticsearch transport error:', error.message);
        }
    };

    // Create Elasticsearch transport instance
    esTransport = new ElasticsearchTransport(esTransportOpts);

}

const logTailTransport = new LogtailTransport(logtail);


// Create logger
const loggerTransports = [];

if (process.env.LOG_TO_LOKI === 'true') {
    loggerTransports.push(
        new LokiTransport({
            host: process.env.LOKI_SERVER,
            interval: 2,
            json: true,
            batching: true,
            clearOnError: true,
            replaceTimestamp: false,
            labels: { job: "payment" },
            format: format.combine(
                format.splat(),
                format.timestamp(),
                format.json()
            ),
            gracefulShutdown: true,
            timeout: 30000,
            onConnectionError: (err) => console.error(err)
        })
    );
}

if (process.env.CLOUD_RUN_TIMEOUT_SECONDS && process.env.LOG_TO_ELASTIC === 'true' && esTransport) {
    loggerTransports.push(esTransport);
}

if (process.env.CLOUD_RUN_TIMEOUT_SECONDS && process.env.LOG_TO_LOGTAIL === 'true') {
    loggerTransports.push(logTailTransport)
}

if (!process.env.CLOUD_RUN_TIMEOUT_SECONDS) {
    loggerTransports.push(new transports.Console())
}

const logger = createLogger({
    format: combine(
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        timestamp(),
        format.metadata(),
        printf(({ level, message, timestamp, stack, metadata }) => {
            if (typeof message === 'object') {
                message = safeStringify(message);
            }
            const jsonFormat = logJsonFormat(level, metadata, message);
            return safeStringify(jsonFormat);
        }),
        sanitizeForTransport()
    ),
    defaultMeta: { service: 'SHAREDSERVICES' },
    transports: loggerTransports,
    exitOnError: false // Prevent exit after an error
});

const logError = (err, type) => {
    logger.error(type, {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
    });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logError(err, 'Uncaught Exception');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logError(reason instanceof Error ? reason : new Error(reason), 'Unhandled Rejection');
});

// Set up process event listeners for graceful shutdown
const shutdown = () => {
    logger.info('Shutting down application...');
};

if (cluster.isMaster) {
    process.on('SIGINT', () => {
        for (const id in cluster.workers) {
            cluster.workers[id].send('shutdown');
        }
        shutdown();
    });

    process.on('SIGTERM', () => {
        for (const id in cluster.workers) {
            cluster.workers[id].send('shutdown');
        }
        shutdown();
    });
} else {
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    process.on('message', (msg) => {
        if (msg === 'shutdown') {
            shutdown();
        }
    });
}

module.exports = logger;
