const Fuse = require('fuse.js');
const { getSearchSuggestionServices, getSearchSuggestionServicesUpdatedAt } = require('../models/use-cases/setting');

// the "searchServices" setting is written by another microservice, so this one can't
// invalidate on write. Instead, check the row's updatedAt (cheap, single-column lookup)
// on every call and only refetch + rebuild the (potentially large) Fuse index when it
// actually changed.
let fuse;
let cachedUpdatedAt = null;

const buildFuse = async (updatedAt) => {
    const services = await getSearchSuggestionServices(updatedAt);
    fuse = new Fuse(services, {
        keys: ['name', 'tags'],
        threshold: 0.3,
    });
};

const searchServices = async (query) => {
    const updatedAt = await getSearchSuggestionServicesUpdatedAt();

    if (!fuse || String(updatedAt) !== String(cachedUpdatedAt)) {
        await buildFuse(updatedAt);
        cachedUpdatedAt = updatedAt;
    }

    const results = fuse.search(query);
    return results.map(r => r.item);
};

module.exports = {
    searchServices
};

