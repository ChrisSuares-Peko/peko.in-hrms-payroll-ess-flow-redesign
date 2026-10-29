
const asyncHandler = require("../../../middlewares/async");
const {
  getTotalDocuments,
  getTotalSubscriptions,
  getTotalSubscriptionsSpent,
  getTotalAssetsAndFleets,
  getUpComingOwnersDocExpiries,
  getUpComingDocExpiries,
  getUpComingChequeLeavesDues,
} = require("../../../models/use-cases/pekoCloud/cloud_dashboard");

exports.getDashDetails = asyncHandler(async (req, res, next) => {
  try {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 
    const results = await Promise.allSettled([
      // Total Documents
      (async () => {
        try {
          const count = await getTotalDocuments(credentialId,subCorporateUserId);
          return { totalDocuments: count || 0 };
        } catch (error) {
          console.error("Error in getTotalDocuments:", error);
          return { totalDocuments: 0 };
        }
      })(),
    
      // Total Subscriptions
      (async () => {
        try {
          const count = await getTotalSubscriptions(credentialId,subCorporateUserId);
          return { totalSubscriptions: count || 0 };
        } catch (error) {
          console.error("Error in getTotalSubscriptions:", error);
          return { totalSubscriptions: 0 };
        }
      })(),
    
      // Total Subscriptions Spent
      (async () => {
        try {
          const totalSpent = await getTotalSubscriptionsSpent(credentialId,subCorporateUserId);
          return { totalSubscriptionsSpent: totalSpent || 0 };
        } catch (error) {
          console.error("Error in getTotalSubscriptionsSpent:", error);
          return { totalSubscriptionsSpent: 0 };
        }
      })(),
    
      // Total Assets and Fleets
      (async () => {
        try {
          const count = await getTotalAssetsAndFleets(credentialId,subCorporateUserId);
          return { totalAssetsAndFleets: count || 0 };
        } catch (error) {
          console.error("Error in getTotalAssetsAndFleets:", error);
          return { totalAssetsAndFleets: 0 };
        }
      })(),
    
      // Reminders List
      (async () => {
        try {
          let reminders = [];
    
          // Upcoming owner document expiries
          const comingOwnerDocsExpires = await getUpComingOwnersDocExpiries(credentialId,subCorporateUserId, 30);
          if (Array.isArray(comingOwnerDocsExpires)) {
            comingOwnerDocsExpires.forEach(({ ownerName, documentType, expireDate }) => {
              reminders.push({
                title: `${ownerName}'s ${documentType} Renewal`,
                subTitle: `Valid till ${expireDate}`,
                date: expireDate,
                icon: "",
                type: "OWNERS_DOCS",
              });
            });
          }
    
          // Upcoming cheque leaves dues
          const comingChequeLeavesDues = await getUpComingChequeLeavesDues(credentialId,subCorporateUserId, 30);
          if (Array.isArray(comingChequeLeavesDues)) {
            comingChequeLeavesDues.forEach(({ payeeName, chequeNumber, dueDate }) => {
              reminders.push({
                title: `${payeeName}'s cheque ${chequeNumber} due`,
                subTitle: `Valid till ${dueDate}`,
                date: dueDate,
                icon: "",
                type: "CHEQUE_LEAVES",
              });
            });
          }
    
          // Upcoming document expiries
          const comingExpiries = await getUpComingDocExpiries(credentialId,subCorporateUserId, 30);
          if (Array.isArray(comingExpiries)) {
            comingExpiries.forEach(({ documentName, documentCategory, expireDate, assetName, vehicleName }) => {
              let reminder = {
                title: `${documentName}'s Renewal`,
                subTitle: `Valid till ${expireDate}`,
                date: expireDate,
                icon: "",
                type: "DOCS",
              };
    
              if (documentCategory === "FLEET") {
                reminder.title = `${documentName} of ${vehicleName}'s Renewal`;
                reminder.type = "FLEETS_DOCS";
              } else if (documentCategory === "ASSET") {
                reminder.title = `${documentName} of ${assetName}'s Renewal`;
                reminder.type = "ASSETS_DOCS";
              } else if (documentCategory === "COMPANY") {
                reminder.type = "COMPANY_DOCS";
              } else if (documentCategory === "FINANCE") {
                reminder.type = "FINANCE_DOCS";
              }
    
              reminders.push(reminder);
            });
          }
    
          // Sort and return top 15 reminders
          reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
          return { remindersList: reminders.slice(0, 15) || [] };
        } catch (error) {
          console.error("Error in generating reminders list:", error);
          return { remindersList: [] };
        }
      })(),
    ]);
    
    // Process results into a single object
    const processedResults = results.reduce((acc, result) => {
      if (result.status === "fulfilled") {
        return { ...acc, ...result.value };
      } else {
        console.error("Promise failed:", result.reason);
        return acc;
      }
    }, {});
    
    console.log("Final Results:", processedResults);
    

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Retrieved dash details",
      data: processedResults,
    });
  } catch (error) {
    next(error);
  }
});

