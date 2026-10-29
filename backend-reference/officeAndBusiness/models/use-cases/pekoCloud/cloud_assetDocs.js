const asyncHandler = require("../../../middlewares/async");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const { Op } = require("sequelize");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const { handleSortFields } = require("../../../utils/sortHandle");
const { uploadFileEncryptedToS3, deleteEncryptedFromS3 } = require("../../../utils/s3");
const { findMaximumUsageLimit } = require("../subscription");
const { NODE_ENV } = process.env;
const accessKey = 'pekoCloud'
let category = "ASSET";
exports.createAssetDoc = asyncHandler(async (data, user) => {
  //checking doc already exist
  const existingDocument = await cloud_documents.findOne({
    where: {
      [Op.or]: [
        { documentName: data.documentName, documentCategory: category, cloudAssetId: data.cloudAssetId },
      ],
    },
  });

  if (existingDocument) {
    return { success: false, error: "Document with this name already exists." };
  }

  if (data.cloudAssetId) {
    const existAsset = await cloud_assets.findOne({
      where: {
        id: data.cloudAssetId
      },
    });
    if (!existAsset) {
      return {
        success: false,
        error: "asset is not existing with the given details",
      };
    }
  }

  // Setting up document Category 
  data.documentCategory = category

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
});

exports.findAllAssetDocs = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  assetId
) => {
  try {
    let order = handleSortFields(sortField, sort)
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
    if (assetId) {
      whereClause.cloudAssetId = assetId;
    }

    const documentsData = await cloud_documents.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: order,
      where: whereClause,
    });

    return { success: true, data: documentsData };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

exports.updateAssetDoc = async (id, newData, user, owner = {}) => {
  const isDocumentExist = await cloud_documents.findOne({
    where: { id: id, documentCategory: category, ...owner },
  });

  if (!isDocumentExist) {
    return {
      success: false,
      error: "document is not existing with the given details",
    };
  }

  if (newData.cloudAssetId) {
    const existAsset = await cloud_assets.findOne({
      where: {
        id: newData.cloudAssetId
      },
    });
    if (!existAsset) {
      return {
        success: false,
        error: "asset is not existing with the given details",
      };
    }
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
};

exports.deleteAssetDoc = async (id, owner = {}) => {
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
    } else {
      return {
        success: false,
        error: "failed to delete the document",
      };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};
