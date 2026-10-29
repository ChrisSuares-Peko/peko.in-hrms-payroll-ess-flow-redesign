const credentialsQueue = require('./credentialsQueue');
const serviceOperatorModel = require('../../models/entities/serviceOperator');
const vendorModel = require('../../models/entities/vendor');
const paymentLinkOnboarding = require('../../models/entities/paymentLinkOnboarding');
const nupayMerchantOnboarding = require('../../models/entities/nupayMerchantOnboarding');
const { customLog } = require('../loggerHelper');

const fetchOperator = async (accessKey, serviceType) => {
    const where = { accessKey };
    if (serviceType) where.serviceType = serviceType;
    return serviceOperatorModel.findOne({
        include: [{
            model: vendorModel,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl', 'optional6', 'optionals'],
        }],
        where,
        raw: true,
        nest: true,
    });
};

const fetchVirtualAccount = async (credentialId) => {
    customLog(null, 'info', { message: '[CredentialsWorker] Fetching VA', credentialId });
    return paymentLinkOnboarding.findOne({
        where: { credentialId },
        attributes: [
            'status',
            'businessName',
            'bankName',
            'accountNumber',
            'ifsc',
            'accountHolderName',
            'phone',
            'virtualAccountId',
            'virtualAccountNumber',
            'virtualIfsc',
        ],
        raw: true,
    });
};

const fetchNupayOnboarding = async (corporateId) => {
    customLog(null, 'info', { message: '[CredentialsWorker] Fetching NuPay onboarding', corporateId });
    return nupayMerchantOnboarding.findOne({
        where: { corporateId },
        attributes: ['status', 'onboardedAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
    });
};

credentialsQueue.process(async (job) => {
    const { accessKey, serviceType } = job.data;
    customLog(null, 'info', { message: '[CredentialsWorker] Job received', jobId: job.id, accessKey, serviceType });

    if (serviceType === 'VIRTUAL_ACCOUNT') {
        const va = await fetchVirtualAccount(accessKey);
        customLog(null, 'info', { message: '[CredentialsWorker] VA lookup result', found: !!va });
        if (!va) throw new Error('Virtual account not found');
        return va;
    }

    if (serviceType === 'NUPAY_ONBOARDING') {
        const record = await fetchNupayOnboarding(accessKey);
        customLog(null, 'info', { message: '[CredentialsWorker] NuPay onboarding lookup result', found: !!record });
        return record || { status: null };
    }

    const vendor = await fetchOperator(accessKey, serviceType);
    customLog(null, 'info', { message: '[CredentialsWorker] Operator lookup result', found: !!vendor });
    if (!vendor) throw new Error('Service is disabled');
    return vendor;
});

credentialsQueue.on('completed', (job) => {
    customLog(null, 'info', { message: '[CredentialsWorker] Job completed', jobId: job.id });
});

credentialsQueue.on('failed', (job, err) => {
    customLog(null, 'error', { message: '[CredentialsWorker] Job failed', jobId: job?.id, error: err?.message });
});

credentialsQueue.on('stalled', (job) => {
    customLog(null, 'info', { message: '[CredentialsWorker] Job stalled', jobId: job?.id });
});

console.log('[CredentialsWorker] Worker started, processing queue: ' + (process.env.VENDOR_CREDS_QUEUE_NAME || 'payroll-vendor-credentials'));
