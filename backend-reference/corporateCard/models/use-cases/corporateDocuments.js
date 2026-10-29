const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async")
const corporateDocuments = require('./../entities/corporateDocuments')

exports.createCorporateDocument = asyncHandler(async (params) => {
    const { documentName, corporateUserId } = params;

    return await corporateDocuments.upsert({
        documentName: documentName,
        corporateUserId: corporateUserId,
        document: params.document,
        documentType: params.documentType,
        fileName: params?.fileName ?? null,
        expiryDate: params?.expiryDate ?? null,
        sizeBytes: params?.sizeBytes ?? null,
        status: "UPLOADED"
    });
})

exports.sumSizeBytes = asyncHandler(async ({ corporateUserId, documentNames }) => {
    const rows = await corporateDocuments.findAll({
        where: { corporateUserId, documentName: { [Op.in]: documentNames } },
        attributes: ['documentName', 'sizeBytes'],
        raw: true,
    });

    return rows.reduce(
        (totals, row) => {
            const bytes = Number(row.sizeBytes)
            if (!Number.isFinite(bytes) || bytes <= 0) {
                return { ...totals, unknown: [...totals.unknown, row.documentName] }
            }
            return { ...totals, totalBytes: totals.totalBytes + bytes }
        },
        { totalBytes: 0, unknown: [] }
    );
})

exports.delectDocfiles = async ({ docNamelist = [], corporateUserId }) =>
    corporateDocuments.destroy({
        where: {
            documentName: docNamelist,
            corporateUserId: corporateUserId,
        },
    });

exports.findAllCorporateDocuments = asyncHandler(async (params) => {
    const { corporateUserId, documentNames } = params

    return await corporateDocuments.findAll({
        where: {
            corporateUserId: corporateUserId,
            documentName: {
                [Op.in]: documentNames
            }
        },
        attributes: ['id', 'documentName', 'document', 'documentType', 'fileName', 'corporateUserId', 'status', 'expiryDate', 'updatedAt'],
        raw: true,
        nest: true,
    })

})
