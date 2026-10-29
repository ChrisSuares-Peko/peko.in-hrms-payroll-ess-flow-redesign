const asyncHandler = require('../../middlewares/async');
const eWaybill = require('../entities/eWaybill');

exports.createEWaybill = asyncHandler(async (params) => {
    return await eWaybill.create(params);
});

exports.getEWaybillById = asyncHandler(async (id) => {
    return await eWaybill.findOne({ where: { id } });
});

exports.updateEWaybill = asyncHandler(async (id, data) => {
    return await eWaybill.update(data, { where: { id } });
});
