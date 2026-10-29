const axios = require('axios');
const dns = require('dns').promises;
const net = require('net');
const ErrorResponse = require('./error-response');

// Private, loopback, link-local (cloud metadata) and other non-public ranges.
const isPrivateIp = (ip) => {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return a === 0 || a === 10 || a === 127
            || (a === 100 && b >= 64 && b <= 127)
            || (a === 169 && b === 254)
            || (a === 172 && b >= 16 && b <= 31)
            || (a === 192 && b === 168)
            || a >= 224;
    }
    const v6 = ip.toLowerCase();
    if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
    return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
};

// Fetches a stored document URL server-side only if it's https and resolves to a public
// address, so stored URLs can't be used to reach internal services or cloud metadata.
const fetchExternalFile = async (rawUrl) => {
    let url;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new ErrorResponse('Invalid document URL', 400);
    }
    if (url.protocol !== 'https:') {
        throw new ErrorResponse('Invalid document URL', 400);
    }
    const addresses = await dns.lookup(url.hostname, { all: true }).catch(() => []);
    if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
        throw new ErrorResponse('Invalid document URL', 400);
    }
    return axios.get(url.toString(), { responseType: 'arraybuffer', maxRedirects: 0, timeout: 15000 });
};

module.exports = { fetchExternalFile, isPrivateIp };
