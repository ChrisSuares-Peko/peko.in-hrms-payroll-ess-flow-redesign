const { fetchVendorCredentials } = require('./credentialsClient');

exports.findServiceOperatorByAccessKey = async (accessKey) => {
    try {
        const service = await fetchVendorCredentials({ accessKey });
        return service || { error: 'Service is disabled' };
    } catch {
        return { error: 'Service is disabled' };
    }
};

exports.fetchServiceDetails = async (details = {}) => {
    const { accessKey, serviceType } = details;
    if (!accessKey) {
        return { error: 'Service not available' };
    }
    try {
        const service = await fetchVendorCredentials({ accessKey, serviceType });
        return service || { error: 'Service not available' };
    } catch {
        return { error: 'Service not available' };
    }
};