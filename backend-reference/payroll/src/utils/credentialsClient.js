const queue = require('./bull/credentialsQueue');
const { customLog } = require('./loggerHelper');

const TIMEOUT_MS = 15000;

exports.fetchVendorCredentials = async ({ accessKey, serviceType }) => {
    customLog(null, 'info', { message: '[CredentialsClient] Fetching vendor credentials', accessKey, serviceType });

    const job = await queue.add(
        { accessKey, serviceType },
        { removeOnComplete: true, removeOnFail: true }
    );
    customLog(null, 'info', { message: '[CredentialsClient] Job added', jobId: job.id });

    const result = await Promise.race([
        job.finished(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Vendor credentials request timed out')), TIMEOUT_MS)
        ),
    ]);

    customLog(null, 'info', { message: '[CredentialsClient] Credentials resolved', accessKey });
    return result;
};
