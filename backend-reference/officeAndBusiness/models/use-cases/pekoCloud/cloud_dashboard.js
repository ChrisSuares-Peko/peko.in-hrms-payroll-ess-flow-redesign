const { humanReadableDate } = require("../../../utils/dateUtils");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const cloud_chequeLeaves = require("../../entities/pekoCloud/cloud_chequeLeaves");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const cloud_owners = require("../../entities/pekoCloud/cloud_owners");
const cloud_subscriptions = require("../../entities/pekoCloud/cloud_subscriptions");

exports.getTotalDocuments = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const result = await cloud_documents.findAndCountAll({
      where: whereClause,
    });
    const documents = result.rows;
    const totalDocuments = documents.filter((doc) => {
      if (doc.documentCategory === "COMPANY") {
        return doc.documentNumber && doc.issueDate;
      }
      return true;
    }).length;
    return totalDocuments;
  } catch (error) {
    console.error(error);
    return error;
  }
};

exports.getTotalSubscriptions = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const count = await cloud_subscriptions.count({
      where: whereClause,
    });
    return count;
  } catch (error) {
    return error;
  }
};

exports.getTotalSubscriptionsSpent = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const subscriptions = await cloud_subscriptions.findAll({
      where: whereClause,
    });
    let totalSpent = 0;
    subscriptions.forEach((subscription) => {
      if (subscription.currency == "USD") {
        totalSpent +=
          Number(
            Number(subscription.dataValues.amount) *
            Number(process.env.USD_TO_INR ?? "1")
          ) * subscription.dataValues.assignTo?.length;
      } else {
        totalSpent +=
          Number(subscription.dataValues.amount) *
          subscription.dataValues.assignTo?.length;
      }
    });
    return totalSpent;
  } catch (error) {
    return error;
  }
};

exports.getTotalAssetsAndFleets = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const assetsCount = await cloud_assets.count({
      where: whereClause,
    });
    const fleetsCount = await cloud_fleets.count({
      where: whereClause,
    });
    return assetsCount + fleetsCount;
  } catch (error) {
    return error;
  }
};

exports.getUpComingChequeLeavesDues = async (credentialId, subCorporateUserId, within) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + within);
    const chequeLeaves = await cloud_chequeLeaves.findAll({
      where: whereClause,
    });
    const upcomingChequeLeavesDues = chequeLeaves
      .map((leaf) => {
        const upcomingCheques = [];
        if (leaf.dueDate) {
          const dueDate = new Date(leaf.dueDate);
          // Compare the due date with the end date
          if (dueDate < endDate && dueDate > today && leaf.status == "Issued") {
            upcomingCheques.push({
              payeeName: leaf.payeeName,
              chequeNumber: leaf.chequeNumber,
              dueDate: humanReadableDate(dueDate),
            });
          }
        }
        return upcomingCheques;
      })
      .flat();
    return upcomingChequeLeavesDues;
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.getUpComingOwnersDocExpiries = async (credentialId, subCorporateUserId, within) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + within);
    const owners = await cloud_owners.findAll({
      where: whereClause,
    });
    const upcomingOwnerDocsExpiry = owners
      .map((owner) => {
        const upcomingDocs = [];
        // Iterate over each owner's documents
        Object.keys(owner.dataValues).forEach((key) => {
          // Check if the key represents a document field
          if (
            ["passport", "visa", "insurance", "ejari", "emiratesId"].includes(
              key
            )
          ) {
            const document = owner.dataValues[key];
            if (document && document.expireDate) {
              const expireDate = new Date(document.expireDate);
              // Compare the expire date with the end date
              if (expireDate < endDate && expireDate > today) {
                upcomingDocs.push({
                  ownerName: owner.dataValues.ownerName,
                  documentType:
                    key != "emiratesId" ? formatText(key) : "Emirates ID",
                  expireDate: humanReadableDate(document.expireDate),
                });
              }
            }
          }
        });
        return upcomingDocs;
      })
      .flat();
    return upcomingOwnerDocsExpiry;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getUpComingDocExpiries = async (credentialId, subCorporateUserId, within) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + within);

    const documents = await cloud_documents.findAll({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName"],
        },
      ],
      where: whereClause,
    });

    const upcomingDocsExpiry = documents
      .map((doc) => {
        // Check if the document has an expiration date
        if (doc.expireDate) {
          const expireDate = new Date(doc.expireDate);
          // Compare the expire date with the end date
          if (expireDate < endDate && expireDate > today) {
            let documentCategoryName = "";
            let documentCategoryValue = "";
            if (doc.documentCategory === "ASSET") {
              documentCategoryName = "assetName";
              documentCategoryValue = doc.cloud_asset.assetName;
            } else if (doc.documentCategory === "FLEET") {
              documentCategoryName = "vehicleName";
              documentCategoryValue = doc.cloud_fleet.vehicleName;
            }
            return {
              documentName: doc.documentName,
              documentNumber: doc.documentNumber,
              documentType: doc.documentType,
              documentCategory: doc.documentCategory,
              issueDate: humanReadableDate(doc.issueDate),
              expireDate: humanReadableDate(doc.expireDate),
              [documentCategoryName]: documentCategoryValue,
            };
          }
        }
        return null;
      })
      .filter((doc) => doc !== null);

    return upcomingDocsExpiry;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const formatText = (text) => {
  if (!text) return "";
  const stringText = String(text); // Convert any input to a string
  return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
