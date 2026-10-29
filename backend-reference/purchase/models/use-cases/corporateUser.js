const corporateUser = require("./../entities/corporateUser");
const wallets = require("../entities/wallet");
const credential = require("./../entities/credential");
const sequelize = require("../../configs/database/index");
const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');
//const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const wallet = require("../entities/wallet");
const packAge = require("../entities/package");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.create = async (params) => {
  let transaction;

  try {
      transaction = await sequelize.transaction();

      const details = await credential.create(params, { transaction });

      await wallet.create(
          { credentialId: details.id },
          { transaction }
      );

      const user = await corporateUser.create(
          {
              ...params,
              credentialId: details.id
          },
          { transaction }
      );

      await transaction.commit();
      return user;

  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error creating user:", error);
      return null;
  }
};


exports.update = asyncHandler(async (params, data) => {
  let docRes = {};
  if (Object.prototype.hasOwnProperty.call(data, "profileImageBase") && data.profileImageFormat) {
    const publicUrl = await uploadFile(data.profileImageBase, "profile", data.profileImageFormat);
    data = {};
    data.logo = publicUrl;
    docRes.logo = publicUrl;
  }
  if (Object.prototype.hasOwnProperty.call(data, "tradeLicenseDoc") && data.trdLcnFormat) {
    const publicUrl = await uploadFile(data.tradeLicenseDoc, "kyc", data.trdLcnFormat);
    //data = {}
    data.tradeLicenseDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.tradeLicenseDoc = publicUrl;
  }
  if (Object.prototype.hasOwnProperty.call(data, "trnCertificate") && data.trnCertFormat) {
    const publicUrl = await uploadFile(data.trnCertificate, "kyc", data.trnCertFormat);
    //data = {}
    data.trnCertificate = publicUrl;
    data.kycStatus = "underReview";
    docRes.trnCertificate = publicUrl;
  }
  let result = await corporateUser.update(data, {
    where: {
      credentialId: params.id,
    },
  });

  if (data.logo) {
    return {
      result: data.logo,
      docs: docRes,
    };
  } else {
    return {
      result: result,
      docs: docRes,
    };
  }
});

exports.deleteAccount = async (credentialId) => {
  try {
    return await corporateUser.update(
      {
        isActive: false,
      },
      {
        where: {
          credentialId,
        },
      }
    );
  } catch (error) {
    console.log(error.message.message);
  } finally {
    console.log("DELETE ACCOUNT ROUTE CALLED");
  }
};

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
  return await corporateUser.findOne({
    include: [
      {
        model: packAge,
      },
      {
        model: credential,
        attributes: ["username"],
      }
    ],
    where: {
      credentialId: params.corporateId,
    },
    attributes,
    nest: true,
    raw: true,
  });
});

exports.findAll = asyncHandler(async (params) => {
  return await corporateUser.findAll({
    where: {
      id: params.id,
    },
  });
});

exports.findCorporateUserData = asyncHandler(async (id) => {


  const data = await corporateUser.findAll({
    where: {
      credentialId: id,
    },
    attributes: ['name', 'email', "dailyReport", "weeklyReport", "monthlyReport"]

  });
  return data
});
exports.findEachCorporateUserData = asyncHandler(async (id) => {


  const data = await corporateUser.findAll({
    where: {
      credentialId: id,
      [Op.and]: Sequelize.literal(`dailyReport->>'$.isActive' = 'true'`),
    },
    attributes: ['name', 'email', "dailyReport", "weeklyReport", "monthlyReport"]

  });
  return data
});



exports.Delete = asyncHandler(async (params) => {
  return await corporateUser.destroy({
    where: {
      id: params.id,
    },
  });
});

exports.updateStatus = asyncHandler(async (req) => {
  const params = req.params;
  const data = req.body;
  return await corporateUser.update(data, {
    where: {
      id: params.id,
    },
  });
});

exports.findAll = asyncHandler(async (params) => {
  let { start, length, searchText, order, column, partnerId } = params;
  const sortableColumns = [
    "id",
    "name",
    "credential.username",
    "email",
    "mobileNo",
    "credentialId",
    "city",
    "balance",
    "isActive",
    "tradeLicenseDoc",
  ];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }
  console.log(partnerId);
  let whereClause = {
    role: "CORPORATE",
  };
  if (typeof partnerId !== "undefined") {
    whereClause.registeredBy = partnerId;
  }
  let data = await corporateUser.findAndCountAll({
    include: [
      {
        model: credential,
        where: whereClause,
        attributes: ["username", "role", "name", "registeredBy"],
      },
    ],
    where: {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          email: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          mobileNo: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          website: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          country: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          city: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          sector: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          poBox: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          countryCode: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          contactPersonName: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          contactPersonEmail: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          contactPersonPhone: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.username$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
  let credentialIds = [];
  let partnerID = []
  for (let i = 0; i < data.rows.length; i++) {
    credentialIds.push(data.rows[i].credentialId);
    if (data.rows[i].credential?.registeredBy != null)
      partnerID.push(data.rows[i].credential?.registeredBy)
  }

  let walletData = await wallets.findAll({
    where: {
      credentialId: {
        [Op.in]: credentialIds,
      },
    },
    raw: true,
  });

  let partnerData = await credential.findAll({
    where: {
      id: {
        [Op.in]: partnerID,
      },
    },
    raw: true,
  });

  let walletObj = {};
  for (let val of walletData) {
    walletObj[val.credentialId] = val.balance;
  }
  for (let i = 0; i < data.rows.length; i++) {
    if (walletObj[data.rows[i].credentialId]) {
      data.rows[i].balance = walletObj[data.rows[i].credentialId];
    }
    if (data.rows[i].credential?.registeredBy != null) {
      let matchingCredential = partnerData.find(cred => cred.id == data.rows[i].credential?.registeredBy);
      data.rows[i].partnerName = matchingCredential.name;
    }
  }
  return data;
});

exports.fetchAll = asyncHandler(async (query, role, registeredBy) => {
  const includeOptions = [
    {
      model: credential,
      where: {
        name: {
          [Op.like]: "%" + query + "%",
        },
        role: role,
      },
    },
  ];

  if (registeredBy) {
    includeOptions[0].where.registeredBy = registeredBy;
  }

  return await corporateUser.findAll({
    include: includeOptions,
    raw: true,
    nest: true,
  });
});

exports.fetchAllCorporates = asyncHandler(async (query, partnerId) => {
  return await corporateUser.findAll({
    include: [
      {
        model: credential,
        where: {
          registeredBy: partnerId,
          name: {
            [Op.like]: "%" + query + "%",
          },
        },
      },
    ],
    raw: true,
    nest: true,
  });
});

exports.Excel = asyncHandler(async (params) => {
  let { order, column, partnerId } = params;
  let whereClause = {
    role: "CORPORATE"
  }
  if (partnerId !== "undefined") {
    whereClause.registeredBy = partnerId;
  }
  let data = await corporateUser.findAndCountAll({
    include: [
      {
        model: credential,
        where: whereClause,
        attributes: ["username", "role", 'registeredBy'],
      },
    ],
    order: [[column, order]],
    raw: true,
    nest: true,
  });
  let credentialIds = [];
  let partnerID = [];
  for (let i = 0; i < data.rows.length; i++) {
    credentialIds.push(data.rows[i].credentialId);
    if (data.rows[i].credential?.registeredBy != null)
      partnerID.push(data.rows[i].credential?.registeredBy)
  }
  let walletData = await wallets.findAll({
    where: {
      credentialId: {
        [Op.in]: credentialIds,
      },
    },
    raw: true,
  });

  let partnerData = await credential.findAll({
    where: {
      id: {
        [Op.in]: partnerID,
      },
    },
    raw: true,
  });
  let walletObj = {};
  for (let val of walletData) {
    walletObj[val.credentialId] = val.balance;
  }
  for (let i = 0; i < data.rows.length; i++) {
    if (walletObj[data.rows[i].credentialId]) {
      data.rows[i].balance = walletObj[data.rows[i].credentialId];
    }
    if (data.rows[i].credential?.registeredBy != null) {
      let matchingCredential = partnerData.find(cred => cred.id == data.rows[i].credential?.registeredBy);
      data.rows[i].partnerName = matchingCredential.name;
    }
  }
  let finalData = [];
  data.rows.forEach(function (limitData) {
    finalData.push({
      CorporateId: limitData.id,
      CorporateName: limitData.name ? limitData.name : "Not Available",
      Username: limitData.credential.username ? limitData.credential.username : "Not Available",
      Email: limitData.email ? limitData.email : "Not Available",
      "Mobile No": limitData.mobileNo ? limitData.mobileNo : "Not Available",
      "Partner ID": limitData.credential?.registeredBy ? limitData.credential?.registeredBy : "Not Available",
      "Partner Name": limitData?.partnerName ? limitData?.partnerName : "Not Available",
      Website: limitData.website ? limitData.website : "Not Available",
      Country: limitData.country ? limitData.country : "Not Available",
      City: limitData.city ? limitData.city : "Not Available",
      Balance: limitData.balance ? limitData.balance + "INR" : "0.0000",
    });
  });
  return finalData;
});


exports.findOneWithCredentialId = asyncHandler(async (credentialId) => {
  return await corporateUser.findOne({
    where: {
      credentialId: credentialId
    }
  })
})

exports.updateDailyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    console.log("CORPORATE USER REPORT UPDATE ROUTE CALLED");

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update dailyStatus');
  }
});

exports.updateWeeklyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET weeklyReport = JSON_SET(weeklyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    console.log("CORPORATE USER REPORT UPDATE ROUTE CALLED");

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update dailyStatus');
  }
});

exports.updateMonthlyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET monthlyReport = JSON_SET(monthlyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    console.log("CORPORATE USER REPORT UPDATE ROUTE CALLED");

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update dailyStatus');
  }
});

exports.updateWeeklyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    const updatedWeeklyReport = {
      ...existingUserData.weeklyReport,
      ...data
    };
    const updatedUser = await corporateUser.update(
      { weeklyReport: updatedWeeklyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );

    return updatedUser;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update weeklyReport');
  }
});


exports.updateMonthlyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    const updatedMonthlyReport = {
      ...existingUserData.monthlyReport,
      ...data
    };
    const updatedUser = await corporateUser.update(
      { monthlyReport: updatedMonthlyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );

    return updatedUser;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update monthlyReport');
  }
});

exports.updateDailyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    const updatedDailyReport = {
      ...existingUserData.dailyReport,
      ...data
    };
    const updatedUser = await corporateUser.update(
      { dailyReport: updatedDailyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );

    return updatedUser;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update dailyReport');
  }
});