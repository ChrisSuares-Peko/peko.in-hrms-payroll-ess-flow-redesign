const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async")
const corporateDocuments = require('./../entities/corporateDocuments')

exports.createCorporateDocument = asyncHandler(async (params) => {
    const { documentName, document, documentType, corporateUserId } = params;

    return await corporateDocuments.upsert({
        documentName: documentName,
        corporateUserId: corporateUserId,
        document: document,
        documentType: documentType,
        status: 'PENDING'
    });
})

exports.findAllCorporateDocuments = asyncHandler(async (params) => {
    const { corporateUserId, documentNames } = params

    return await corporateDocuments.findAll({
        where: {
            corporateUserId: corporateUserId,
            documentName: {
                [Op.in]: documentNames
            }
        },
        attributes: ['id', 'documentName', 'document', 'documentType', 'corporateUserId'],
        raw: true,
        nest: true,
    })

})

exports.updateAllCorporateDocuments = asyncHandler(async (params) => {
    const { corporateUserId, documentNames, documentStatus } = params;

    // Update the documents that match the criteria
    const [updatedCount] = await corporateDocuments.update(
        { status: documentStatus }, // The update values should be an object
        {
            where: {
                corporateUserId: corporateUserId,
                documentName: {
                    [Op.in]: documentNames
                }
            }
        }
    );

    // Optionally, return the number of records updated
    return { updatedCount };
});
