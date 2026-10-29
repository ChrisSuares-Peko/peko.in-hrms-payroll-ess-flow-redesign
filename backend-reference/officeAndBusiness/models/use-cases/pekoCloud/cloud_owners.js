const asyncHandler = require("../../../middlewares/async");
const cloud_owners = require("../../entities/pekoCloud/cloud_owners");
const { Op } = require("sequelize");
const {
  deleteEncryptedFromS3,
  uploadFileEncryptedToS3,
} = require("../../../utils/s3");
const { findMaximumUsageLimit } = require("../subscription");
const ErrorResponse = require("../../../utils/error-response");
const { uploadFile, deleteFile } = require("../../../utils/commonUploadFile");
const accessKey = "pekoCloud";

exports.createOwner = asyncHandler(async (data, user) => {
  try {
    //checking owner already exist
    const existingOwner = await cloud_owners.findOne({
      where: {
        [Op.or]: [
          { ownerName: data.ownerName, credentialId: data.credentialId },
        ],
      },
    });

    if (existingOwner) {
      return { success: false, error: "Owner with this name already exists." };
    }

    if (data.percentageOfShare) {
      const totalPercentage = await cloud_owners.sum("percentageOfShare", {
        where: { credentialId: data.credentialId },
      });

      const maxAllowedPercentage = 100;
      const currentTotalPercentage = Number(totalPercentage);
      const maxAddablePercentage =
        maxAllowedPercentage - currentTotalPercentage;
      const newTotalPercentage =
        currentTotalPercentage + Number(data?.percentageOfShare);

      if (newTotalPercentage > maxAllowedPercentage) {
        return {
          success: false,
          error: `The total percentage of shares must not exceed ${maxAllowedPercentage}%. Currently, the percentage of shares held by the owners is ${currentTotalPercentage.toFixed(
            2
          )}% totally. Add Percentage of Share accordingly (Max. percentage that can be added: ${maxAddablePercentage.toFixed(
            2
          )}%).`,
        };
      }
    }

    let filePath;
    if (user?.role === "CORPORATE_SUB_USER" && user?.subCorporateId) {
      filePath = `corporate/${
        user?.username ? user?.username : "unknown-user"
      }/peko-cloud/sub-user/${
        user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"
      }`;
      data.subCorporateUserId = user?.subCorporateId;
    } else {
      filePath = `${
        user?.role ? user?.role.toLowerCase() : "unknown-role"
      }/${user?.username ? user?.username : "unknown-user"}/peko-cloud`;
    }
    if (
      Object.prototype.hasOwnProperty.call(data, "profileImageBase") &&
      data.profileImageFormat
    ) {
      const maximumStorageAccess = await findMaximumUsageLimit({
        corporateId: user.corporateId,
        accessKey: accessKey,
      });
      const publicUrl = await uploadFile(
        data.profileImageBase,
        filePath,
        data.profileImageFormat,
        maximumStorageAccess
      );
      data.profilePicture = publicUrl;
    }

    const responseData = await cloud_owners.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create owner." };
    }
    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findAllOwners = async (
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
    // if (searchText) {
    //   whereClause = {
    //     [Op.or]: [
    //       { employeeName: { [Op.like]: `%${searchText}%` } },
    //       { employeeID: { [Op.like]: `%${searchText}%` } },
    //       { employeeEmail: { [Op.like]: `%${searchText}%` } },
    //     ],
    //   };
    // }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const ownersData = await cloud_owners.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: ownersData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.updateOwner = async (id, newData, user, owner = {}) => {
  try {
    const isOwnerExist = await cloud_owners.findOne({
      where: { id, ...owner },
    });

    if (!isOwnerExist) {
      return {
        success: false,
        error: "owner is not existing with the given details",
      };
    }

    if (
      newData.percentageOfShare &&
      newData.percentageOfShare !== isOwnerExist.percentageOfShare
    ) {
      // Sum the percentageOfShare of all other owners for the same credentialId
      const totalOtherOwnersShare = await cloud_owners.sum(
        "percentageOfShare",
        {
          where: {
            credentialId: isOwnerExist.credentialId,
            id: { [Op.ne]: id }, // Exclude the current owner from the sum
          },
        }
      );

      const maxAllowedPercentage = 100;
      const maxAddablePercentage =
        maxAllowedPercentage - Number(totalOtherOwnersShare);
      const newTotalPercentage =
        Number(totalOtherOwnersShare) + Number(newData.percentageOfShare);

      if (newTotalPercentage > maxAllowedPercentage) {
        return {
          success: false,
          error: `The total percentage of shares after updating would exceed 100%. Currently, the total percentage held by other owners is ${totalOtherOwnersShare.toFixed(
            2
          )}%. Please adjust the new share accordingly (Max. percentage that can be added: ${maxAddablePercentage.toFixed(
            2
          )}%).`,
        };
      }
    }

    const documentTypes = [
      "passport",
      "visa",
      "insurance",
      "emiratesId",
      "ejari",
      "bankDetails",
    ];

    let filePath;
    if (user?.role === "CORPORATE_SUB_USER" && user?.subCorporateId) {
      filePath = `corporate/${
        user?.username ? user?.username : "unknown-user"
      }/peko-cloud/sub-user/${
        user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"
      }`;
    } else {
      filePath = `${
        user?.role ? user?.role.toLowerCase() : "unknown-role"
      }/${user?.username ? user?.username : "unknown-user"}/peko-cloud`;
    }

    for (const documentType of documentTypes) {
      if (
        newData[documentType] &&
        Object.prototype.hasOwnProperty.call(
          newData[documentType],
          "documentBase"
        ) &&
        newData[documentType].documentFormat
      ) {
        if (isOwnerExist[documentType]?.document) {
          await deleteEncryptedFromS3(isOwnerExist[documentType]?.document);
        }
        const maximumStorageAccess = await findMaximumUsageLimit({
          corporateId: user.corporateId,
          accessKey: accessKey,
        });
        const fileKey = await uploadFileEncryptedToS3(
          newData[documentType]?.documentBase,
          filePath,
          newData[documentType]?.documentFormat,
          maximumStorageAccess
        );
        newData[documentType].document = fileKey;
        delete newData[documentType].documentBase;
        delete newData[documentType].documentFormat;
        break;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(newData, "profileImageBase") &&
      newData.profileImageFormat
    ) {
      if (isOwnerExist.profilePicture) {
        await deleteFile(isOwnerExist.profilePicture);
      }
      const maximumStorageAccess = await findMaximumUsageLimit({
        corporateId: user.corporateId,
        accessKey: accessKey,
      });
      const publicUrl = await uploadFile(
        newData.profileImageBase,
        filePath,
        newData.profileImageFormat,
        maximumStorageAccess
      );
      newData.profilePicture = publicUrl;
    }

    const updateOwner = await cloud_owners.update(newData, {
      where: { id: id, ...owner },
    });

    if (updateOwner[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the owner",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.deleteOwner = async (id, owner = {}) => {
  try {
    const isOwnerExist = await cloud_owners.findOne({
      where: { id, ...owner },
    });

    if (!isOwnerExist) {
      return {
        success: false,
        error: "owner is not existing with the given details",
      };
    }

    const documentTypes = [
      "passport",
      "visa",
      "insurance",
      "emiratesId",
      "ejari",
      "bankDetails",
    ];
    for (const documentType of documentTypes) {
      if (isOwnerExist[documentType]?.document) {
        await deleteEncryptedFromS3(isOwnerExist[documentType].document);
      }
    }
    if (isOwnerExist?.profilePicture) {
      await deleteFile(isOwnerExist.profilePicture);
    }

    const deletedRowsCount = await cloud_owners.destroy({
      where: { id: id, ...owner },
    });

    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    } else {
      return {
        success: false,
        error: "something went wrong while deleting the owner",
      };
    }
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};
