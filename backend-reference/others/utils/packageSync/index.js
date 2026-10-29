const ErrorResponse = require('../error-response');
const { customLog } = require('../loggerHelper');

const providers = [require('./providers/pekoPos'), require('./providers/accounting')];
const byAccessKey = new Map(providers.map(p => [p.accessKey, p]));

const describeProvider = ({ accessKey, label, packageAccessCode, syncedFields }) => ({
    accessKey,
    label,
    packageAccessCode,
    syncedFields,
});

exports.describeProvider = describeProvider;
exports.listProviders = () => providers.map(describeProvider);
exports.getProvider = accessKey => byAccessKey.get(accessKey) || null;

exports.normalizePartnerId = partnerId =>
    partnerId === undefined || partnerId === null || partnerId === '' || partnerId === 'default'
        ? null
        : String(partnerId);

exports.loadVendorPlans = async (provider, traceId) => {
    let plans;
    try {
        plans = await provider.fetchPlans(traceId);
    } catch (err) {
        if (err instanceof ErrorResponse) throw err;
        customLog(traceId, 'error', {
            message: '[packageSync] vendor fetch failed',
            accessKey: provider.accessKey,
            status: err?.response?.status || null,
            error: err?.message,
        });
        throw new ErrorResponse(`Unable to fetch plans from ${provider.label}`, 502);
    }
    if (!plans.length) throw new ErrorResponse(`${provider.label} returned no plans; nothing was changed`, 502);
    return plans;
};
