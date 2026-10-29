const { NODE_ENV } = process.env;
const asyncHandler = require("../../../middlewares/async");
const cloud_chequeBooks = require("../../entities/pekoCloud/cloud_chequeBooks");
const cloud_chequeLeaves = require("../../entities/pekoCloud/cloud_chequeLeaves");
const { Op } = require("sequelize");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../utils/s3");
const { findMaximumUsageLimit } = require("../subscription");
const ErrorResponse = require("../../../utils/error-response");
const accessKey = 'pekoCloud'

exports.createChequeLeaf = asyncHandler(async (data, user) => {
  try {
    //checking chequeLeaf already exist
    const existingChequeLeaf = await cloud_chequeLeaves.findOne({
      where: {
        [Op.or]: [
          {
            chequeBookNumber: data.chequeBookNumber,
            chequeNumber: data.chequeNumber,
          },
        ],
      },
    });

    if (existingChequeLeaf) {
      return {
        success: false,
        error: "Cheque Leaf with this Book and Cheque Number already exists.",
      };
    }

    if (data.cloudChequeBookId) {
      const existBook = await cloud_chequeBooks.findOne({
        where: {
          id: data.cloudChequeBookId,
        },
      });
      if (!existBook) {
        return {
          success: false,
          error: "cheque book is not existing with the given details",
        };
      }
    }

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

    const responseData = await cloud_chequeLeaves.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create cheque leaf." };
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findSingleChequeLeaf = asyncHandler(async (id, owner = {}) => {
  try {
    //fetch single chequeLeaf
    const chequeLeaf = await cloud_chequeLeaves.findOne({
      where: {
        id: id,
        ...owner,
      },
    });
    if (!chequeLeaf) {
      return {
        success: false,
        error: "Cheque Leaf with this details doesn't exists.",
      };
    }

    return { success: true, data: chequeLeaf };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findAllChequeLeavesList = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const chequeLeavesData = await cloud_chequeLeaves.findAndCountAll({
      where: whereClause,
    });

    return { success: true, data: chequeLeavesData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.findAllChequeLeaves = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  chequeBookId,
  subCorporateUserId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;

    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { type: { [Op.like]: `%${searchText}%` } },
          { payeeName: { [Op.like]: `%${searchText}%` } },
          { chequeBookNumber: { [Op.like]: `%${searchText}%` } },
          { bankAccount: { [Op.like]: `%${searchText}%` } },
          { signedBy: { [Op.like]: `%${searchText}%` } },
          { chequeNumber: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    if (chequeBookId) {
      whereClause.cloudChequeBookId = chequeBookId;
    }

    const chequeLeavesData = await cloud_chequeLeaves.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: chequeLeavesData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateChequeLeaf = async (id, newData, user, owner = {}) => {
  try {
    const isChequeLeafExist = await cloud_chequeLeaves.findOne({
      where: { id, ...owner },
    });

    if (!isChequeLeafExist) {
      return {
        success: false,
        error: "cheque leaf is not existing with the given details",
      };
    }

    if (newData.cloudChequeBookId) {
      const existBook = await cloud_chequeBooks.findOne({
        where: {
          id: newData.cloudChequeBookId,
        },
      });
      if (!existBook) {
        return {
          success: false,
          error: "cheque book is not existing with the given details",
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
      if (isChequeLeafExist.document) {
        await deleteEncryptedFromS3(isChequeLeafExist.document);
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

    const updateChequeLeaf = await cloud_chequeLeaves.update(newData, {
      where: { id: id, ...owner },
    });

    if (updateChequeLeaf[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the cheque leaf",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteChequeLeaf = async (id, owner = {}) => {
  try {
    const isChequeLeafExist = await cloud_chequeLeaves.findOne({
      where: { id, ...owner },
    });

    if (!isChequeLeafExist) {
      return {
        success: false,
        error: "cheque leaf is not existing with the given details",
      };
    }
    if (isChequeLeafExist.document) {
      await deleteEncryptedFromS3(isChequeLeafExist.document);
    }

    const deletedChequeLeafRowsCount = await cloud_chequeLeaves.destroy({
      where: { id: id, ...owner },
    });
    if (deletedChequeLeafRowsCount == 0) {
      return {
        success: false,
        error: "cheque leaf is not able to delete try again",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.getFinancialInfo = async (credentialId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    const chequeLeavesData = await cloud_chequeLeaves.findAndCountAll({
      where: whereClause,
    });

    const documentsData = await cloud_documents.findAndCountAll({
      where: { ...whereClause, documentCategory: "FINANCE" },
    });

    return {
      success: true,
      data: { chequeLeaves: chequeLeavesData, financials: documentsData },
    };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
