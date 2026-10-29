const { humanReadableDate } = require("../../../utils/dateUtils");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const cloud_owners = require("../../entities/pekoCloud/cloud_owners");
const cloud_subscriptions = require("../../entities/pekoCloud/cloud_subscriptions");
const cloud_chequeLeaves = require("../../entities/pekoCloud/cloud_chequeLeaves");

exports.getExpiredOwnerDocs = async (credentialId, subCorporateUserId) => {
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
    const owners = await cloud_owners.findAll({
      where: whereClause,
    });
    const expiredOwnerDocs = owners
      .map((owner) => {
        const expiredDocs = [];
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
              if (expireDate < endDate) {
                expiredDocs.push({
                  ownerName: owner.dataValues.ownerName,
                  documentType:  key != "emiratesId" ? formatText(key) : "Emirates ID",
                  expireDate: humanReadableDate(document.expireDate),
                  details: JSON.stringify(owner.dataValues),
                });
              }
            }
          }
        });
        return expiredDocs;
      })
      .flat();
    return expiredOwnerDocs;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getRenewalAssets = async (credentialId) => {
  try {
    const today = new Date();
    const assets = await cloud_assets.findAll({
      include: [
        {
          model: cloud_employees,
          attributes: ["id", "employeeName", "employeeEmail", "department"],
        },
      ],
      where: {
        credentialId: credentialId,
      },
    });
    const expiredAssets = assets
      .map((asset) => {
        if (asset?.purchasedDate) {
          const purchasedDate = new Date(asset.purchasedDate);
          const timeDiff = today.getTime() - purchasedDate.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days

          if (
            (asset.amountRecurring === "MONTHLY" && daysDiff % 30 === 0) ||
            (asset.amountRecurring === "YEARLY" && daysDiff % 365 === 0)
          ) {
            // Today's date is a multiple of either 30 days or 365 days from the purchase date

            return {
              assetName: asset.assetName,
              usedBy: asset.cloud_employee.employeeName,
              renewalDate: humanReadableDate(today),
              details: JSON.stringify(asset),
            };
          }
        }
        return null;
      })
      .filter((doc) => doc !== null);
    return expiredAssets;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getRenewalFleets = async (credentialId, subCorporateUserId) => {
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
    const fleets = await cloud_fleets.findAll({
      include: [
        {
          model: cloud_employees,
          attributes: ["id", "employeeName", "employeeEmail", "department"],
        },
      ],
      where: whereClause,
    });
    const expiredFleets = fleets
      .map((fleet) => {
        if (fleet?.dateOfRenewal) {
          const renewalDate = new Date(fleet.dateOfRenewal);

          if (renewalDate <= today) {
            return {
              fleetName: fleet.vehicleName,
              fleetNumber: fleet.vehicleNumber,
              usedBy: fleet.cloud_employee?.employeeName ?? "",
              renewalDate: humanReadableDate(renewalDate),
              details: JSON.stringify(fleet),
            };
          }
        }
        return null;
      })
      .filter((doc) => doc !== null);
    return expiredFleets;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getRenewalSubscriptions = async (credentialId, subCorporateUserId) => {
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
    const subscriptions = await cloud_subscriptions.findAll({
      where: whereClause,
    });
    const expiredSubscriptions = subscriptions
      .map((subscription) => {
        if (subscription?.billingStartDate) {
          const billingStartDate = new Date(subscription.billingStartDate);
          const isMonthly = subscription.billingCycle === "Monthly";
          const isYearly = subscription.billingCycle === "Yearly";

          let isRenewal = false;

          // Exclude subscriptions that start today
          const isStartingToday =
            billingStartDate.getDate() === today.getDate() &&
            billingStartDate.getMonth() === today.getMonth() &&
            billingStartDate.getFullYear() === today.getFullYear();

          if (!isStartingToday) {
            if (isMonthly) {
              isRenewal = billingStartDate.getDate() === today.getDate();
            } else if (isYearly) {
              isRenewal =
                billingStartDate.getDate() === today.getDate() &&
                billingStartDate.getMonth() === today.getMonth();
            }
          }

          if (isRenewal) {
            return {
              subscriptionName: subscription.subscriptionName,
              billingCycle: subscription.billingCycle,
              renewalDate: humanReadableDate(today),
              details: JSON.stringify(subscription),
            };
          }
        }
        return null;
      })
      .filter((doc) => doc !== null);
    return expiredSubscriptions;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getDueChequeLeaves = async (credentialId, subCorporateUserId) => {
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
    const chequeLeaves = await cloud_chequeLeaves.findAll({
      where: whereClause,
    });
    const dueChequeLeaves = chequeLeaves
      .map((leaf) => {
        if (leaf?.dueDate) {
          const dueDate = new Date(leaf.dueDate);

          let isRenewal = dueDate <= today && leaf.status == "Issued";

          if (isRenewal) {
            return {
              payeeName: leaf.payeeName,
              chequeNumber: leaf.chequeNumber,
              type: leaf.type,
              dueDate: humanReadableDate(dueDate),
              details: JSON.stringify(leaf),
            };
          }
        }
        return null;
      })
      .filter((doc) => doc !== null);
    return dueChequeLeaves;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.getExpiredDocs = async (credentialId, subCorporateUserId) => {
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

    const documents = await cloud_documents.findAll({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [
            {
              model: cloud_employees,
              attributes: ["id", "employeeName"],
            },
          ],
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [
            {
              model: cloud_employees,
              attributes: ["id", "employeeName"],
            },
          ],
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
          if (expireDate < endDate) {
            let documentCategoryName = "";
            let documentCategoryValue = "";
            let assignedTo = "";
            if (doc.documentCategory === "ASSET") {
              documentCategoryName = "assetName";
              documentCategoryValue = doc.cloud_asset.assetName;
              if (doc?.cloud_asset?.cloud_employee?.employeeName) {
                assignedTo = doc?.cloud_asset?.cloud_employee?.employeeName;
              }
            } else if (doc.documentCategory === "FLEET") {
              documentCategoryName = "vehicleName";
              documentCategoryValue = `${doc.cloud_fleet.vehicleName} ${doc.cloud_fleet.vehicleNumber}`;
              if (doc?.cloud_fleet?.cloud_employee?.employeeName) {
                assignedTo = doc?.cloud_fleet?.cloud_employee?.employeeName ?? "";
              }
            }
            return {
              documentName: doc.documentName,
              documentNumber: doc.documentNumber,
              documentType: doc.documentType,
              documentCategory: doc.documentCategory,
              issueDate: humanReadableDate(doc.issueDate),
              expireDate: humanReadableDate(doc.expireDate),
              [documentCategoryName]: documentCategoryValue,
              assignedTo,
              details: JSON.stringify(doc),
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
