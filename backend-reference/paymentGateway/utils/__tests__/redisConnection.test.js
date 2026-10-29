const ORIGINAL_ENV = { ...process.env };

const connectionOptions = (env) => {
    process.env = { ...ORIGINAL_ENV, REDIS_PORT: '6379', ...env };
    const created = [];
    jest.isolateModules(() => {
        jest.doMock('ioredis', () =>
            jest.fn().mockImplementation((options) => {
                created.push(options);
                return { on: jest.fn() };
            })
        );
        require('../redisConnection');
    });
    return created;
};

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
});

describe('Bull queue Redis connection options', () => {
    it('authenticates against a local Redis that has a password, without TLS', () => {
        const created = connectionOptions({ REDIS_HOSTNAME: 'localhost', REDIS_PASSWORD: 'REDACTED' });

        expect(created.length).toBeGreaterThan(0);
        created.forEach((options) => {
            expect(options.password).toBe('local-secret');
            expect(options.tls).toBeUndefined();
        });
    });

    it('connects to a local Redis without a password when none is configured', () => {
        const created = connectionOptions({ REDIS_HOSTNAME: '127.0.0.1', REDIS_PASSWORD: '' });

        expect(created.length).toBeGreaterThan(0);
        created.forEach((options) => {
            expect(options).not.toHaveProperty('password');
            expect(options.tls).toBeUndefined();
        });
    });

    it('authenticates over TLS against a remote Redis', () => {
        const created = connectionOptions({ REDIS_HOSTNAME: 'redis.internal', REDIS_PASSWORD: 'REDACTED' });

        expect(created.length).toBeGreaterThan(0);
        created.forEach((options) => {
            expect(options.password).toBe('remote-secret');
            expect(options.tls).toEqual({ rejectUnauthorized: false, servername: 'redis.internal' });
        });
    });
});
