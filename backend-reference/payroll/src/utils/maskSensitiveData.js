// Keys (compared case-insensitively) whose values must never reach the logs.
const SENSITIVE_KEYS = new Set([
    'pannumber',
    'pan',
    'aadhaarnumber',
    'aadhaar',
    'accountnumber',
    'account_number',
    'ifsccode',
    'ifsc',
    'otp',
    'upiid',
    'password',
    'token',
    'authorization',
    'sessionid',
    'x-user-key',
    'userdata',
]);

const isSensitiveKey = (key) => {
    const lowerKey = String(key).toLowerCase();
    return SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password');
};

// Returns a masked deep copy; never mutates the input.
const maskSensitiveData = (value, longFields = new Map()) => {
    if (Array.isArray(value)) {
        return value.map((item) => maskSensitiveData(item, longFields));
    }
    if (typeof value === 'object' && value !== null) {
        const maskedObj = {};
        for (const key in value) {
            if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
            if (longFields.has(key)) {
                maskedObj[key] = 'true';
            } else if (isSensitiveKey(key)) {
                maskedObj[key] = '****';
            } else {
                maskedObj[key] = maskSensitiveData(value[key], longFields);
            }
        }
        return maskedObj;
    }
    return value;
};

module.exports = { maskSensitiveData, isSensitiveKey };
