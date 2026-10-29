/* eslint-disable no-unused-vars */
const asyncHandler = require("../../../middlewares/async");
const {
  getExpiredOwnerDocs,
  getExpiredDocs,
  getRenewalAssets,
  getRenewalFleets,
  getRenewalSubscriptions,
  getDueChequeLeaves,
} = require("../../../models/use-cases/pekoCloud/cloud_taskToDo");
const { formatString } = require("../../../utils/formatter");

exports.getToDoList = asyncHandler(async (req, res, next) => {
  try {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 
    let results = [];
    let toDoList = [];

    //expired owner docs
    let expiredOwnerDocs = await getExpiredOwnerDocs(credentialId,subCorporateUserId);

    if (expiredOwnerDocs.length) {
      expiredOwnerDocs.forEach((data) => {
        let { ownerName, documentType, expireDate, details } = data;

        toDoList.push({
          title: `${formatString(ownerName)}'s ${documentType} has expired on`,
          date: expireDate,
          icon: "",
          type: "OWNERS_DOCS",
          details,
        });
      });
    }

    // //renewal asset
    // let renewalAssets = await getRenewalAssets(credentialId);

    // renewalAssets.forEach((data) => {
    //   let { assetName, usedBy, renewalDate } = data;

    //   toDoList.push({
    //     title: `${usedBy}'s ${assetName} is due for renewal on`,
    //     date: renewalDate,
    //     icon: "",
    //     type: "ASSETS",
    //   });
    // });

    //renewal fleet
    let renewalFleets = await getRenewalFleets(credentialId,subCorporateUserId);
    if (renewalFleets.length) {
      renewalFleets.forEach((data) => {
        let { fleetName, fleetNumber, usedBy, renewalDate, details } = data;

        let msg = usedBy
          ? `The registration renewal date (${renewalDate}) for ${formatString(
              usedBy
            )}'s ${fleetName} ${fleetNumber} has passed`
          : `The registration renewal date (${renewalDate}) for ${fleetName} ${fleetNumber} has passed`;

        toDoList.push({
          title: msg,
          date: "", // date passed in message
          icon: "",
          type: "FLEETS",
          details,
        });
      });
    }

    //renewal subscription
    let renewalSubscriptions = await getRenewalSubscriptions(credentialId,subCorporateUserId);
    if (renewalSubscriptions.length) {
      renewalSubscriptions.forEach((data) => {
        let { subscriptionName, renewalDate, details, billingCycle } = data;

        toDoList.push({
          title: `${formatString(
            subscriptionName
          )}'s ${billingCycle.toLowerCase()} subscription is due for renewal on`,
          date: renewalDate,
          icon: "",
          type: "SUBSCRIPTIONS",
          details,
        });
      });
    }

    //due cheque leaves
    let dueChequeLeaves = await getDueChequeLeaves(credentialId,subCorporateUserId);
    if (dueChequeLeaves.length) {
      dueChequeLeaves.forEach((data) => {
        let { payeeName, chequeNumber, type, dueDate, details } = data;

        toDoList.push({
          title: `The due date (${dueDate}) of the cheque ${chequeNumber} has passed`,
          date: "", // date passed in message
          icon: "",
          type: "CHEQUE_LEAVES",
          details,
        });
      });
    }

    //docs expired
    let expiredDocs = await getExpiredDocs(credentialId,subCorporateUserId);
    if (expiredDocs.length) {
      expiredDocs.forEach((data) => {
        let {
          documentName,
          documentCategory,
          expireDate,
          assetName,
          vehicleName,
          assignedTo,
          details,
        } = data;
        if (documentCategory == "FLEET") {
          let msg = assignedTo ? `${formatString(documentName)} of ${assignedTo}'s ${vehicleName} has expired on` 
                    : `${formatString(documentName)} of ${vehicleName} has expired on`
          toDoList.push({
            title: msg,
            date: expireDate,
            icon: "",
            type: "FLEETS_DOCS",
            details,
          });
        } else if (documentCategory == "ASSET") {
          let msg = assignedTo ? `${formatString(documentName)} of ${assignedTo}'s ${assetName} has expired on` 
                    : `${formatString(documentName)} of ${assetName} has expired on`
          toDoList.push({
            title: msg,
            date: expireDate,
            icon: "",
            type: "ASSETS_DOCS",
            details,
          });
        } else if (documentCategory == "COMPANY") {
          toDoList.push({
            title: `${formatString(documentName)} has expired on`,
            date: expireDate,
            icon: "",
            type: "COMPANY_DOCS",
            details,
          });
        } else {
          toDoList.push({
            title: `${formatString(documentName)} has expired on`,
            date: expireDate,
            icon: "",
            type: "FINANCIAL_DOCS",
            details,
          });
        }
      });
    }
    // in ascending order
    toDoList.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstUpcomingTasks = toDoList.slice(0, 15);
    results = firstUpcomingTasks || [];

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Retrieved Tasks To Do List",
      data: results,
    });
  } catch (error) {
    next(error);
  }
});
