const buildQuery = (params) => {
    let query = '';
    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            value.forEach(v => { query += `&${key}=${encodeURIComponent(v)}`; });
        } else {
            query += `&${key}=${encodeURIComponent(value)}`;
        }
    }
    return query.substring(1);
};

const resolveHostingEndpoint = (productId) => {
    const p = String(productId || '').toLowerCase();
    const isMulti = p.includes('multidomain');
    const os = p.includes('windows') ? 'windows' : 'linux';
    const location = p.endsWith('in') ? 'in' : 'us';
    const apiType = isMulti ? 'multidomainhosting' : 'singledomainhosting';
    return { apiType, os, location };
};

const ORDER_DETAIL_RESOLVERS = {
    vps_server: (baseUrl, authParams, orderId, productId) => {
        const location = String(productId || '').toLowerCase().includes('us') ? 'us' : 'in';
        const url = `${baseUrl}/api/virtualserver/linux/${location}/details.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId), options: 'All' });
        return { url, query };
    },

    shared_hosting: (baseUrl, authParams, orderId, productId) => {
        const { apiType, os, location } = resolveHostingEndpoint(productId);
        const url = `${baseUrl}/api/${apiType}/${os}/${location}/details.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId), options: 'All' });
        return { url, query };
    },

    titan_email: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/restapi/product/titanmailindia`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId) });
        return { url, query, method: 'GET' };
    },

    google_workspace: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/api/gapps/in/details.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId), options: 'All' });
        return { url, query };
    },

    domain: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/api/domains/details.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId), options: 'All' });
        return { url, query };
    },
};

module.exports = { buildQuery, resolveHostingEndpoint, ORDER_DETAIL_RESOLVERS };
