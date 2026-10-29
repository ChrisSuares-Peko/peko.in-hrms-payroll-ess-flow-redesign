
const corporateUser = require("./../entities/corporateUser");
const wallets = require("../entities/wallet");
const credential = require("./../entities/credential");
const sequelize = require("../../configs/database/index");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const packAge = require("../entities/package");
const { QueryTypes } = require('sequelize');
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter");
const access_codes = require("../entities/access_codes");
const { uploadFile } = require("../../utils/commonUploadFile");
const Transaction = require("../entities/transaction");
const Subscription = require("../entities/subscription");
const subCorporateUsers = require("../entities/subCorporateUsers");
const ErrorResponse = require("../../utils/error-response");

const DUPLICATE_MESSAGES = {
  email: "The email ID is already associated with another account.",
  mobileNo: "The mobile number is already associated with another account.",
};

// email/mobile must be free in corporateUsers, credentials and subCorporateUsers
const ensureEmailMobileAvailable = async (credentialId, email, mobileNo) => {
  const fields = [];
  if (email) fields.push({ email });
  if (mobileNo) fields.push({ mobileNo });

  const [corporateMatch, subUserMatch, credentialMatch] = await Promise.all([
    corporateUser.findOne({
      where: { [Op.or]: fields, credentialId: { [Op.ne]: credentialId } },
      attributes: ["email", "mobileNo"],
      raw: true,
    }),
    subCorporateUsers.findOne({
      where: { [Op.or]: fields, isDeleted: false },
      attributes: ["email", "mobileNo"],
      raw: true,
    }),
    email
      ? credential.findOne({
          where: { email, id: { [Op.ne]: credentialId } },
          attributes: ["id"],
          raw: true,
        })
      : null,
  ]);

  const match = corporateMatch || subUserMatch;
  if (match) {
    const field = mobileNo && match.mobileNo === mobileNo ? "mobileNo" : "email";
    throw new ErrorResponse(DUPLICATE_MESSAGES[field], 403);
  }
  if (credentialMatch) {
    throw new ErrorResponse(DUPLICATE_MESSAGES.email, 403);
  }
};

const mapUniqueConstraintError = (error) => {
  if (error?.name === "SequelizeUniqueConstraintError") {
    const path = (error?.errors?.[0]?.path || "").toLowerCase();
    if (path.includes("mobile")) return new ErrorResponse(DUPLICATE_MESSAGES.mobileNo, 403);
    if (path.includes("email")) return new ErrorResponse(DUPLICATE_MESSAGES.email, 403);
  }
  return error;
};

exports.update = asyncHandler(async (params, data, _user) => {
  void _user;
  let docRes = {};

  if (data.email) data.email = data.email.toLowerCase();
  if (data.email || data.mobileNo) {
    await ensureEmailMobileAvailable(params.corporateId, data.email, data.mobileNo);
  }

  if (Object.prototype.hasOwnProperty.call(data, "profileImageBase") && data.profileImageFormat) {
    const publicUrl = await uploadFile(data.profileImageBase, 'profile', data.profileImageFormat);
    data.logo = publicUrl;
    docRes.logo = publicUrl;
  }
  if(data.profileImageBase === ''){
    data.logo = null;
    docRes.logo = null;
  }
  if (Object.prototype.hasOwnProperty.call(data, "tradeLicenseDoc") && data.trdLcnFormat) {
    const publicUrl = await uploadFile(data.tradeLicenseDoc, 'kyc', data.trdLcnFormat);
    data.tradeLicenseDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.tradeLicenseDoc = publicUrl;
  }
  if (Object.prototype.hasOwnProperty.call(data, "panDoc") && data.panFormat) {
    const publicUrl = await uploadFile(data.panDoc, 'kyc', data.panFormat);
    data.panDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.panDoc = publicUrl;
  }
  if (Object.prototype.hasOwnProperty.call(data, "tanDoc") && data.tanFormat) {
    const publicUrl = await uploadFile(data.tanDoc, "kyc", data.tanFormat);
    data.tanDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.tanDoc = publicUrl;
  }  
  if (Object.prototype.hasOwnProperty.call(data, "gstDoc") && data.gstFormat) {
    const publicUrl = await uploadFile(data.gstDoc, "kyc", data.gstFormat);
    data.gstDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.gstDoc = publicUrl;
  }
  if (Object.prototype.hasOwnProperty.call(data, "cinDoc") && data.cinFormat) {
    const publicUrl = await uploadFile(data.cinDoc, "kyc", data.cinFormat);
    data.cinDoc = publicUrl;
    data.kycStatus = "underReview";
    docRes.cinDoc = publicUrl;
  }

  if (Object.prototype.hasOwnProperty.call(data, "trnCertificate") && data.trnCertFormat) {
    const publicUrl = await uploadFile(data.trnCertificate, "kyc", data.trnCertFormat);
    data.trnCertificate = publicUrl;
    data.kycStatus = "underReview";
    docRes.trnCertificate = publicUrl;
  }

  data.isMFA = data.sendMfaCodeToAuthApp || data.sendMfaCodeToEmail || data.sendMfaCodeToPhone;

  // keep credentials (login identity) in sync with corporateUsers
  const credentialData = {};
  if (data.email) credentialData.email = data.email;
  if (data.name) credentialData.name = data.name;

  const transaction = await sequelize.transaction();
  let result;
  try {
    result = await corporateUser.update(data, {
      where: {
        credentialId: params.corporateId,
      },
      transaction,
    });
    if (Object.keys(credentialData).length) {
      await credential.update(credentialData, {
        where: { id: params.corporateId },
        transaction,
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw mapUniqueConstraintError(error);
  }

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
  const { credentialsAttr } = attributes || {};
  return await corporateUser.findOne({
    include: [
      {
        model: packAge,
      },
      {
        model: credential,
        attributes: credentialsAttr,
      },
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
  try {
    let {
      offset,
      limit,
      sort,
      sortField,
      searchText,
      partnerId,
      subPartnerId,
      from,
      to
     } = params;
   
  
     const fromDate = from ? new Date(from) : null;
     const toDate = to ? new Date(to) : null;
     let order = handleSortFields(sortField,sort)
    let whereClause = {
      role: "CORPORATE",
    };

    if (fromDate instanceof Date && !isNaN(fromDate.getTime()) &&
    toDate instanceof Date && !isNaN(toDate.getTime())) {
    whereClause.createdAt = {
      [Op.between]: [fromDate, toDate]
    };
  }
    if (partnerId === 'default') {
      whereClause.registeredBy = null;
  } else if (partnerId) {
      whereClause.registeredBy = partnerId;
      if(subPartnerId){
        whereClause.subPartnerId = subPartnerId;
      }
    }

    let searchCondition = {};
    if (searchText) {
      searchCondition = {
        [Op.or]: [
          { id: { [Op.like]: `%${searchText}%` } },
          { email: { [Op.like]: `%${searchText}%` } },
          { name: { [Op.like]: `%${searchText}%` } },
          { mobileNo: { [Op.like]: `%${searchText}%` } },
          { website: { [Op.like]: `%${searchText}%` } },
          { country: { [Op.like]: `%${searchText}%` } },
          { city: { [Op.like]: `%${searchText}%` } },
          { sector: { [Op.like]: `%${searchText}%` } },
          { poBox: { [Op.like]: `%${searchText}%` } },
          { countryCode: { [Op.like]: `%${searchText}%` } },
          { contactPersonName: { [Op.like]: `%${searchText}%` } },
          { contactPersonEmail: { [Op.like]: `%${searchText}%` } },
          { contactPersonPhone: { [Op.like]: `%${searchText}%` } },
          { "$credential.username$": { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    const data = await corporateUser.findAndCountAll({
      include: [
        {
          model: credential,
          where: whereClause,
          attributes: [
            "username",
            "role",
            "name",
            "registeredBy",
            "passwordProtection",
            "subPartnerId",
            "accountType",
          ],
        },
      ],
      where: searchCondition,
      order,
      limit,
      offset,
      raw: true,
      nest: true,
    });

    if (!data.rows.length) return data;

    const credentialIds = data.rows.map((r) => r.credentialId);
    const corporateIds = data.rows.map((r) => r.id);

    const partnerIDs = data.rows
      .map((r) => r.credential?.registeredBy)
      .filter(Boolean);

    const subPartnerIds = data.rows
      .map((r) => r.credential?.subPartnerId)
      .filter(Boolean);

    const [walletData, merchantIdData, partnerData, subPartnersData] =
      await Promise.all([
        wallets.findAll({
          where: { credentialId: { [Op.in]: credentialIds } },
          raw: true,
        }),
        access_codes.findAll({
          where: { corporateUserId: { [Op.in]: corporateIds } },
          raw: true,
        }),
        credential.findAll({
          where: { id: { [Op.in]: partnerIDs } },
          raw: true,
        }),
        credential.findAll({
          where: { id: { [Op.in]: subPartnerIds } },
          raw: true,
        }),
      ]);

    const walletObj = Object.fromEntries(
      walletData.map((w) => [w.credentialId, w.balance])
    );

    const partnerObj = Object.fromEntries(
      partnerData.map((p) => [p.id, p.name])
    );

    const subPartnerObj = Object.fromEntries(
      subPartnersData.map((p) => [p.id, p.name])
    );

    const merchantObj = Object.fromEntries(
      merchantIdData.map((m) => [m.corporateUserId, m.access_code])
    );

    for (let row of data.rows) {
      row.balance = walletObj[row.credentialId] || 0;

      if (row.credential?.registeredBy) {
        row.partnerName = partnerObj[row.credential.registeredBy];
      }

      if (row.credential?.subPartnerId) {
        row.subPartnerName = subPartnerObj[row.credential.subPartnerId];
      }

      if (merchantObj[row.id]) {
        row.merchantId = merchantObj[row.id];
      }
    }

    return data;
  } catch (error) {
    console.log(error);
    if (error.message.includes('findAndCountAll')) {
      throw new Error('Database error');
    } else if (error.message.includes('findAll') && error.message.includes('wallets')) {
      throw new Error('Wallets error');
    } else {
      throw new Error('Something went wrong');
    }
  }
});

exports.corporateUserExports = asyncHandler(async (params) => {
  try {
    let { sort, sortField, searchText, partnerId ,subPartnerId, from, to } = params

    let order = handleSortFields(sortField, sort);
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    let whereClauseCredential = {
      role: "CORPORATE",
    };
    if (fromDate instanceof Date && !isNaN(fromDate.getTime()) &&
    toDate instanceof Date && !isNaN(toDate.getTime())) {
      whereClauseCredential.createdAt = {
      [Op.between]: [fromDate, toDate]
    };
  }
    if (partnerId === "default") {
      whereClauseCredential.registeredBy = null;
    } else if (partnerId) {
      whereClauseCredential.registeredBy = partnerId;
      if (subPartnerId) {
        whereClauseCredential.subPartnerId = subPartnerId;
      }
    }

    let searchCondition = {};
    if (searchText) {
      searchCondition = {
        [Op.or]: [
          { id: { [Op.like]: `%${searchText}%` } },
          { email: { [Op.like]: `%${searchText}%` } },
          { name: { [Op.like]: `%${searchText}%` } },
          { mobileNo: { [Op.like]: `%${searchText}%` } },
          { website: { [Op.like]: `%${searchText}%` } },
          { country: { [Op.like]: `%${searchText}%` } },
          { city: { [Op.like]: `%${searchText}%` } },
          { sector: { [Op.like]: `%${searchText}%` } },
          { poBox: { [Op.like]: `%${searchText}%` } },
          { countryCode: { [Op.like]: `%${searchText}%` } },
          { contactPersonName: { [Op.like]: `%${searchText}%` } },
          { contactPersonEmail: { [Op.like]: `%${searchText}%` } },
          { contactPersonPhone: { [Op.like]: `%${searchText}%` } },
          { "$credential.username$": { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    const data = await corporateUser.findAndCountAll({
      include: [
        {
          model: credential,
          where: whereClauseCredential,
          attributes: [
            "username",
            "role",
            "name",
            "registeredBy",
            "passwordProtection",
          ],
        },
      ],
      where: searchCondition,
      order,
      raw: true,
      nest: true,
    });

    if (!data.rows.length) return [];

    const credentialIds = data.rows.map((r) => r.credentialId);
    const partnerIDs = data.rows
      .map((r) => r.credential?.registeredBy)
      .filter(Boolean);

    const [walletData, partnerData] = await Promise.all([
      wallets.findAll({
        where: { credentialId: { [Op.in]: credentialIds } },
        raw: true,
      }),
      credential.findAll({
        where: { id: { [Op.in]: partnerIDs } },
        raw: true,
      }),
    ]);

    const walletObj = Object.fromEntries(
      walletData.map((w) => [w.credentialId, w.balance])
    );

    const partnerObj = Object.fromEntries(
      partnerData.map((p) => [p.id, p.name])
    );

    let finalData = data.rows.map((row) => ({
      Date: row.createdAt
        ? formattedDateTime(row.createdAt)
        : "Not Available",

      "Corporate Name": row.credential?.name || "Not Available",
      "Account ID": row.credential?.username || "Not Available",
      "Mobile No": row.mobileNo || "Not Available",
      "Email ID": row.email || "Not Available",
      "Partner ID": row.credential?.registeredBy || "Not Available",
      "Partner Name":
        partnerObj[row.credential?.registeredBy] || "Not Available",
      Balance: walletObj[row.credentialId]
        ? "₹ " + formatNumberWithLocalString(walletObj[row.credentialId])
        : "0.00",
      City: row.city || "Not Available",
      Status: row.isActive > 0 ? "Active" : "In Active",
    }));

    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.fetchAll = async (
  query,
  role,
  registeredBy,
  subPartnerId,
  selectedPartnerId,
  selectedSubPartnerId
) => {
  const search = query || "";

  // Filters that scope WHICH credentials are eligible (role, partner) — kept on the credential join.
  const credentialWhere = {
    role,
    name: { [Op.ne]: null },
  };

  if (selectedPartnerId) {
    credentialWhere.registeredBy = selectedPartnerId;
  } else if (registeredBy) {
    credentialWhere.registeredBy = registeredBy;
  }

  if (selectedSubPartnerId) {
    credentialWhere.subPartnerId = selectedSubPartnerId;
  } else if (subPartnerId) {
    credentialWhere.subPartnerId = subPartnerId;
  }

  // Free-text search spans credential name/username AND the corporate's email (top-level so it can
  // reference the joined credential columns alongside corporateUser.email).
  const searchWhere = {
    [Op.or]: [
      { "$credential.name$": { [Op.like]: `%${search}%` } },
      { "$credential.username$": { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ],
  };

  return await corporateUser.findAll({
    where: searchWhere,
    include: [
      {
        model: credential,
        where: credentialWhere,
        attributes: ["name", "username"],
        required: true,
      },
    ],
    attributes: [
      "name",
      "id",
      "credentialId",
      "city",
      "mobileNo",
      "email",
      [sequelize.col("corporateUser.registeredBy"), "registeredById"],
      [
        sequelize.literal(
          `(SELECT c.name FROM credentials AS c WHERE c.id = corporateUser.registeredBy LIMIT 1)`
        ),
        "registeredByName",
      ],
    ],
    order: [[{ model: credential }, "name", "ASC"]],
    raw: true,
    nest: true,
  });
};


exports.findCorporateUserData = asyncHandler(async (id) => {


  const data = await corporateUser.findOne({
    where: {
      credentialId: id,
    },
    attributes: ['name', 'email', "dailyReport", "weeklyReport", "monthlyReport"]

  });
  return data
});

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

exports.findOneWithCredentialId = asyncHandler(async (credentialId) => {
  return await corporateUser.findOne({
    where: {
      credentialId: credentialId
    }
  })
})
exports.findAllCorporate = asyncHandler(async () => {
  return await corporateUser.findAll({
    attributes: ["email", "name", "registeredBy"],
    raw: true
  })
})

exports.findCorporatesByPackage = asyncHandler(async (packageId) => {
  return await corporateUser.findAll({
    where: { packageId },
    attributes: ["email", "name", "registeredBy"],
    raw: true
  })
})

exports.fetchCorporateList = async (query, role, registeredBy, subPartnerId, selectedPartnerId, selectedSubPartnerId) => {
  const includeOptions = [
    {
      model: credential,
      where: {
        role: role,
        name: { [Op.ne]: null }
      },
      attributes: ['username']
    },
  ];

  if (query) {
    includeOptions[0].where[Op.or] = [
      { name: { [Op.like]: "%" + query + "%" } },
      { username: { [Op.like]: "%" + query + "%" } },
      { email: { [Op.like]: "%" + query + "%" } }
    ];
  }

  if (registeredBy) includeOptions[0].where.registeredBy = registeredBy;
  if (subPartnerId) includeOptions[0].where.subPartnerId = subPartnerId;
  if (selectedPartnerId) includeOptions[0].where.registeredBy = selectedPartnerId;
  if (selectedSubPartnerId) includeOptions[0].where.subPartnerId = selectedSubPartnerId;

  return await corporateUser.findAll({
    include: includeOptions,
    attributes: [
      'id',
      'name',
      'email',
      [
        sequelize.literal(`(SELECT c.name FROM credentials AS c WHERE c.id = corporateUser.registeredBy LIMIT 1)`),
        'partnerName',
      ],
    ],
    order: [[{ model: credential }, 'name', 'ASC']],
    raw: true,
    nest: true,
  });
};

exports.getCorporateFullDetails = async ({ searchText }) => {
  let cred = await credential.findOne({
    where: {
      [Op.or]: [
        { email: searchText },
        { username: searchText }
      ]
    }
  });

  let corpUserWhere = {};
  if (cred) {
    corpUserWhere.credentialId = cred.id;
  } else if (searchText) {
    corpUserWhere.email = searchText;
  } else {
    return null;
  }

  const corpUser = await corporateUser.findOne({
    where: corpUserWhere,
    include: [
      { model: credential },
      { model: packAge }
    ]
  });

  if (!corpUser) return null;

  if (!cred && corpUser.credential) {
    cred = corpUser.credential;
  }

  const credentialId = cred?.id;

  const [activeSubscription, transactionStats] = await Promise.all([
    corpUser.id
      ? Subscription.findOne({
          where: { corporateUserId: corpUser.id },
          order: [['createdAt', 'DESC']],
          include: [{ model: packAge }]
        })
      : null,
    credentialId
      ? Transaction.findOne({
          where: { credentialId },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
            [sequelize.fn('SUM', sequelize.col('debitAmount')), 'totalSpent'],
            [sequelize.fn('MIN', sequelize.col('transactionDate')), 'firstTransactionDate'],
            [sequelize.fn('MAX', sequelize.col('transactionDate')), 'lastTransactionDate']
          ],
          raw: true
        })
      : null
  ]);

  return {
    cred,
    corpUser,
    activeSubscription,
    totalTransactions: Number(transactionStats?.totalTransactions || 0),
    totalSpent: Number(transactionStats?.totalSpent || 0),
    firstTransactionDate: transactionStats?.firstTransactionDate || null,
    lastTransactionDate: transactionStats?.lastTransactionDate || null
  };
};