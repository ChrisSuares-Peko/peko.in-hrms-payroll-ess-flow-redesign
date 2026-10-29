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
        expiryDate: params?.expiryDate ?? null,
        status: "UPLOADED" // on One-KYB upload should keep status as UPLOADED !
    });
})

exports.delectDocfiles = async ({ docNamelist = [], corporateUserId }) => {
    try {
      const deletedCount = await corporateDocuments.destroy({
        where: {
          documentName: docNamelist,
          corporateUserId: corporateUserId,
        },
      });
  
      return deletedCount > 0; // true if deleted, false otherwise
    } catch (error) {
      console.log(error);
      return false;
    }
};

exports.findAllCorporateDocuments = asyncHandler(async (params) => {
    const { corporateUserId, documentNames } = params

    return await corporateDocuments.findAll({
        where: {
            corporateUserId: corporateUserId,
            documentName: {
                [Op.in]: documentNames
            }
        },
        attributes: ['id', 'documentName', 'document', 'documentType', 'corporateUserId', 'status', 'expiryDate'],
        raw: true,
        nest: true,
    })

})