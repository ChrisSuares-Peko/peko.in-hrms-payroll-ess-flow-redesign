const { findServiceOperatorByAccessKey } = require('../../checkAndFetchServiceDetails');
const ErrorResponse = require('../../error-response');
const vendorRequest = require('../vendorRequest');
const { mapPlan } = require('../mapPlan');

const ACCESS_KEY = 'accounting';

const fieldMap = {
    externalId: '_id',
    packageName: 'title',
    description: raw => (Array.isArray(raw.available_benefits) ? raw.available_benefits : []).join('\n'),
};

exports.accessKey = ACCESS_KEY;
exports.label = 'Accounting (Timber)';
exports.packageAccessCode = 'accounting';
exports.syncedFields = ['packageName', 'description'];
exports.fieldMap = fieldMap;

exports.fetchPlans = async traceId => {
    const service = await findServiceOperatorByAccessKey(ACCESS_KEY);
    const vendor = service && !service.error ? service.vendor : null;
    if (!vendor?.apiUrl || !vendor?.optional1) throw new ErrorResponse('Accounting vendor configuration is missing', 503);

    const body = await vendorRequest({
        label: ACCESS_KEY,
        url: `${vendor.apiUrl}/user/partner/external/plans`,
        params: { search: 'monthly' },
        headers: { Authorization: `Bearer ${vendor.optional1}` },
        traceId,
    });
    const plans = body?.status ? body?.data?.plans : null;
    if (!Array.isArray(plans)) throw new ErrorResponse('Accounting vendor returned an unexpected plans response', 502);
    return plans.map(raw => mapPlan(raw, fieldMap)).filter(Boolean);
};
