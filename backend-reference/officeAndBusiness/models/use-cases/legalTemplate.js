const { Op } = require('sequelize');
const asyncHandler = require('../../middlewares/async');
const legalTemplate = require('../entities/legalTemplate');
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime } = require('../../utils/formatter');
const { uploadFile } = require('../../utils/commonUploadFile');
const { customLog } = require('../../utils/loggerHelper');

exports.findAllAndCount = asyncHandler(async (params) => {
    const { page, itemsPerPage, searchText, sort, sortField, onlyActive, category, logTraceId } = params;
    try {
        const offset = (page - 1) * itemsPerPage;
        const order = handleSortFields(sortField, sort);
        const searchPattern = `%${searchText}%`;

        const where = {
            [Op.or]: [
                { title: { [Op.like]: searchPattern } },
                { category: { [Op.like]: searchPattern } },
                { description: { [Op.like]: searchPattern } },
            ],
        };
        if (onlyActive) where.isActive = true;
        if (category) where.category = category;

        return await legalTemplate.findAndCountAll({
            where,
            order,
            limit: itemsPerPage,
            offset,
            raw: true,
            nest: true,
        });
    } catch (error) {
        customLog(logTraceId, 'error', { error: error.message });
        throw { message: 'Something went wrong' };
    }
});

exports.create = asyncHandler(async (params) => {
    if (params.documentBase && params.documentFormat) {
        const publicUrl = await uploadFile(params.documentBase, 'docs/legal-templates', params.documentFormat);
        params.documentUrl = publicUrl;
    }
    delete params.documentBase;
    delete params.documentFormat;
    return await legalTemplate.create(params);
});

exports.update = asyncHandler(async (id, data) => {
    if (data.documentBase && data.documentFormat) {
        const publicUrl = await uploadFile(data.documentBase, 'docs/legal-templates', data.documentFormat);
        data.documentUrl = publicUrl;
    }
    delete data.documentBase;
    delete data.documentFormat;
    return await legalTemplate.update(data, { where: { id } });
});

exports.toggleStatus = asyncHandler(async (id) => {
    const template = await legalTemplate.findOne({ where: { id }, raw: true });
    if (!template) return false;
    return await legalTemplate.update({ isActive: !template.isActive }, { where: { id } });
});

exports.findOneById = asyncHandler(async (id) => {
    return await legalTemplate.findOne({ where: { id }, raw: true });
});

exports.deleteById = asyncHandler(async (id) => {
    const template = await legalTemplate.findOne({ where: { id }, raw: true });
    if (!template) return false;
    await legalTemplate.destroy({ where: { id } });
    return true;
});

exports.findAllForExport = asyncHandler(async (params) => {
    const { searchText, sort, sortField, logTraceId } = params;
    try {
        const order = handleSortFields(sortField, sort);
        const searchPattern = `%${searchText}%`;

        const data = await legalTemplate.findAndCountAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: searchPattern } },
                    { category: { [Op.like]: searchPattern } },
                    { description: { [Op.like]: searchPattern } },
                ],
            },
            order,
            raw: true,
            nest: true,
        });

        const finalData = [];
        data.rows.forEach((row) => {
            finalData.push({
                Date: row.createdAt ? formattedDateTime(row.createdAt) : 'Not Available',
                Title: row.title || 'Not Available',
                Category: row.category || 'Not Available',
                Description: row.description || 'Not Available',
                'Time Estimate': row.timeEstimate || 'Not Available',
                Status: row.isActive ? 'Active' : 'Inactive',
            });
        });

        return finalData;
    } catch (error) {
        customLog(logTraceId, 'error', { error: error.message });
        throw { message: 'Something went wrong' };
    }
});
