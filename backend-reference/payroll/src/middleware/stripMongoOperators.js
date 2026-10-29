// Removes keys that start with '$' (MongoDB operators such as $ne, $gt, $where) from
// client input, so values like ?employee[$ne]=x or {"status": {"$ne": null}} can't be
// smuggled into queries or updates. Legitimate payloads never use '$' keys.
const stripOperators = (value) => {
    if (Array.isArray(value)) {
        value.forEach(stripOperators);
    } else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
        Object.keys(value).forEach((key) => {
            if (key.startsWith('$')) {
                delete value[key];
            } else {
                stripOperators(value[key]);
            }
        });
    }
    return value;
};

const stripMongoOperators = (req, res, next) => {
    stripOperators(req.body);
    stripOperators(req.query);
    stripOperators(req.params);
    next();
};

module.exports = stripMongoOperators;
