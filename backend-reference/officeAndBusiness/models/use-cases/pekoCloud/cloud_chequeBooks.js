const asyncHandler = require("../../../middlewares/async");
const cloud_chequeBooks = require("../../entities/pekoCloud/cloud_chequeBooks");
const { Op } = require("sequelize");
const { NODE_ENV } = process.env;
const sequelize = require("../../../configs/database/index");
const cloud_chequeLeaves = require("../../entities/pekoCloud/cloud_chequeLeaves");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../utils/s3");
const ErrorResponse = require("../../../utils/error-response");
const { findMaximumUsageLimit } = require("../subscription");
const accessKey = 'pekoCloud'

exports.createChequeBook = asyncHandler(async (data, user) => {
  //checking chequeBook already exist
  const existingChequeBook = await cloud_chequeBooks.findOne({
    where: {
      [Op.or]: [
        {
          bookId: data.bookId,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
        },
      ],
    },
  });

  if (existingChequeBook) {
    return {
      success: false,
      error: "Cheque Book with this ID and Account Number already exists.",
    };
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
    try {
      const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: accessKey })
      const fileKey = await uploadFileEncryptedToS3(
        data.documentBase,
        filePath,
        data.documentFormat,
        maximumStorageAccess
      );
      data.document = fileKey;
    } catch (error) {
      return { success: false, error: "File upload failed." };
    }
  }
  try {
    const responseData = await cloud_chequeBooks.create(data);
    return { success: true, data: responseData };
  } catch (error) {
    return { success: false, error: "Failed to create cheque book." };
  }
});

exports.findSingleChequeBook = asyncHandler(async (id, owner = {}) => {
  try {
    //fetch single chequeBook
    const chequeBook = await cloud_chequeBooks.findOne({
      where: {
        id: id,
        ...owner,
      },
    });
    if (!chequeBook) {
      return {
        success: false,
        error: "Cheque Book with this details doesn't exists.",
      };
    }

    return { success: true, data: chequeBook };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findAllChequeBooksList = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const chequeBooksData = await cloud_chequeBooks.findAndCountAll({
      where: whereClause,
    });

    return { success: true, data: chequeBooksData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.findAllChequeBooks = async (
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
          { bookId: { [Op.like]: `%${searchText}%` } },
          { accountName: { [Op.like]: `%${searchText}%` } },
          { accountNumber: { [Op.like]: `%${searchText}%` } },
          { bankName: { [Op.like]: `%${searchText}%` } },
          { currency: { [Op.like]: `%${searchText}%` } },
          { chequeStarting: { [Op.like]: `%${searchText}%` } },
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

    const chequeBooksData = await cloud_chequeBooks.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: chequeBooksData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateChequeBook = async (id, newData, user, owner = {}) => {
  try {
    const isChequeBookExist = await cloud_chequeBooks.findOne({
      where: { id, ...owner },
    });

    if (!isChequeBookExist) {
      return {
        success: false,
        error: "cheque book is not existing with the given details",
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
      if (isChequeBookExist.document) {
        await deleteEncryptedFromS3(isChequeBookExist.document);
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

    const updateChequeBook = await cloud_chequeBooks.update(newData, {
      where: { id: id, ...owner },
    });

    if (updateChequeBook[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the cheque book",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteChequeBook = async (id, owner = {}) => {
  let transaction = await sequelize.transaction();
  try {
    const isChequeBookExist = await cloud_chequeBooks.findOne({
      where: { id, ...owner },
    });

    if (!isChequeBookExist) {
      return {
        success: false,
        error: "cheque book is not existing with the given details",
      };
    }
    if (isChequeBookExist.document) {
      await deleteEncryptedFromS3(isChequeBookExist.document);
    }

    await cloud_chequeLeaves.destroy({
      where: { cloudChequeBookId: id },
      transaction: transaction,
    });

    const deletedChequeBookRowsCount = await cloud_chequeBooks.destroy({
      where: { id: id, ...owner },
      transaction: transaction,
    });

    if (deletedChequeBookRowsCount == 0) {
      return {
        success: false,
        error: "cheque book is not able to delete try again",
      };
    }

    await transaction.commit();
    return { success: true, data: {} };
  }
  catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
