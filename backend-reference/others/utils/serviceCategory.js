const operatorsData = require('./operatorsData.json');

const CATEGORY_BY_ACCESS_KEY = Object.values(operatorsData).reduce((map, entry) => {
    if (entry && entry.accessKey && entry.category && !map[entry.accessKey]) {
        map[entry.accessKey] = entry.category;
    }
    return map;
}, {});

const categoryForAccessKey = (accessKey) =>
    (accessKey ? CATEGORY_BY_ACCESS_KEY[String(accessKey).trim()] : null) || null;

module.exports = { categoryForAccessKey, CATEGORY_BY_ACCESS_KEY };
