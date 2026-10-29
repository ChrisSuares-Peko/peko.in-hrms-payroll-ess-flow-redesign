const { findServiceOperatorByAccessKey } = require('../../checkAndFetchServiceDetails');
const ErrorResponse = require('../../error-response');
const vendorRequest = require('../vendorRequest');
const { mapPlan } = require('../mapPlan');

const ACCESS_KEY = 'peko_pos';

const fieldMap = {
    externalId: 'id',
    packageName: 'name',
};

exports.accessKey = ACCESS_KEY;
exports.label = 'Peko POS (Restonik)';
exports.packageAccessCode = 'peko_pos';
exports.syncedFields = ['packageName'];
exports.fieldMap = fieldMap;

exports.fetchPlans = async traceId => {
    const service = await findServiceOperatorByAccessKey(ACCESS_KEY);
    const vendor = service && !service.error ? service.vendor : null;
    if (!vendor?.apiUrl || !vendor?.optional1) throw new ErrorResponse('Peko POS vendor configuration is missing', 503);

    const body = await vendorRequest({
        label: ACCESS_KEY,
        url: `${vendor.apiUrl}/plans`,
        headers: { 'X-API-Key': vendor.optional1 },
        traceId,
    });
    if (!body?.success || !Array.isArray(body.data)) {
        throw new ErrorResponse('Peko POS returned an unexpected plans response', 502);
    }
    return body.data.map(raw => mapPlan(raw, fieldMap)).filter(Boolean);
};
