const asyncHandler = require("../../../middlewares/async");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const { Op } = require("sequelize");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../utils/s3");
const { findMaximumUsageLimit } = require("../subscription");
const ErrorResponse = require("../../../utils/error-response");
const { NODE_ENV } = process.env;
const accessKey = 'pekoCloud'
let category = "FINANCE";
exports.createFinancialDoc = asyncHandler(async (data,user) => {
  try {
    //checking doc already exist
    const existingDocument = await cloud_documents.findOne({
      where: {
        [Op.or]: [
          {
            documentName: data.documentName,
            documentCategory: category,
            credentialId: data.credentialId,
          },
        ],
      },
    });
  
    if (existingDocument) {
      return { success: false, error: "Document with this name already exists." };
    }
  
    // Setting up document Category
    data.documentCategory = category;
  
    let filePath;
    if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
      filePath = `${NODE_ENV ? NODE_ENV : "staging"}/corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
      data.subCorporateUserId = user?.subCorporateId
    } else {
      filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
    }
  
    if (
      Object.prototype.hasOwnProperty.call(data, "documentBase") &&
      data.documentFormat
    ) {
      const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: accessKey })
      const fileKey = await uploadFileEncryptedToS3(
        data.documentBase,
        filePath,
        data.documentFormat,
        maximumStorageAccess
      );
      data.document = fileKey;
    }
  
    const responseData = await cloud_documents.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create document." };
    }
    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findAllFinancialDocsList = async (credentialId,subCorporateUserId) => {
  try {
    let whereClause = {};
    if (category) {
      whereClause.documentCategory = category;
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const documentsData = await cloud_documents.findAndCountAll({
      where: whereClause,
    });
  
    return { success: true, data: documentsData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.countAllFinancialDocs = async (credentialId,subCorporateUserId) => {
  try {
    let whereClause = {};
    if (category) {
      whereClause.documentCategory = category;
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const documentsCount = await cloud_documents.count({
      where: whereClause,
    });
  
    return { success: true, data: documentsCount };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.findAllFinancialDocs = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;
  
    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { documentName: { [Op.like]: `%${searchText}%` } },
          { documentNumber: { [Op.like]: `%${searchText}%` } },
          { documentType: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (category) {
      whereClause.documentCategory = category;
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const documentsData = await cloud_documents.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });
  
    return { success: true, data: documentsData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateFinancialDoc = async (id, newData, user, owner = {}) => {
  try {
    const isDocumentExist = await cloud_documents.findOne({
      where: { id: id, documentCategory: category, ...owner },
    });
  
    if (!isDocumentExist) {
      return {
        success: false,
        error: "document is not existing with the given details",
      };
    }
  
    
    let filePath;
    if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
      filePath = `${NODE_ENV ? NODE_ENV : "staging"}/corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
    } else {
      filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
    }
    
    if (
      Object.prototype.hasOwnProperty.call(newData, "documentBase") &&
      newData.documentFormat
    ) {
      if (isDocumentExist.document) {
        await deleteEncryptedFromS3(isDocumentExist.document);
      }
      const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: accessKey })
      const fileKey = await uploadFileEncryptedToS3(
        newData.documentBase,
        filePath,
        newData.documentFormat,
        maximumStorageAccess
      );
      newData.document = fileKey;
    }
  
    const updateDoc = await cloud_documents.update(newData, {
      where: { id: id, documentCategory: category, ...owner },
    });
  
    if (updateDoc[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the document",
      };
    }
  
    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteFinancialDoc = async (id, owner = {}) => {
  try {
    const isDocumentExist = await cloud_documents.findOne({
      where: { id: id, documentCategory: category, ...owner },
    });
  
    if (!isDocumentExist) {
      return {
        success: false,
        error: "document is not existing with the given details",
      };
    }
    if (isDocumentExist.document) {
      await deleteEncryptedFromS3(isDocumentExist.document);
    }
  
    const deletedRowsCount = await cloud_documents.destroy({
      where: { id: id, documentCategory: category, ...owner },
    });
  
    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    }else{
      return {
        success: false,
        error: "something went wrong while deleting the document",
      };
    }
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
