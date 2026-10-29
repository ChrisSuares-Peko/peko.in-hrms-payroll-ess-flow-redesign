const { customLog } = require("../../utils/loggerHelper");
const analytics = require("../entities/analytics");
const systemUser = require("../entities/systemUser")
const credential = require("../entities/credential")
const order = require("../entities/order")
const roleAndPermissions = require("../entities/roleAndPermissions")
const ServiceOperator = require("../entities/serviceOperator")
const sequelize = require('../../configs/database/index');


const { literal, col, fn, Op, where} = require("sequelize");

exports.getServiceSearchRecords = async () => {
  try {
    const data = await analytics.findOne({
      where: {
        name: "serviceSearchRecords",
      },
    });
    return data?.details;
  } catch (error) {
    customLog(null, "error", {
      message: "Error fetching service search records",
      error,
    });
    return {
      success: false,
      message: "Error fetching service search records",
      error: error.message || error,
    };
  }
};

/**
 * Stores the search records for a service
 * @param {Object} params - The parameters for storing search records
 * @param {string} params.credentialId - The ID of the credential
 * @param {string} params.service - The name of the service
 * @return {Promise<Object>} - A promise that resolves to the result of the operation
 */
exports.storeServiceSearchRecords = async ({ credentialId, service }) => {
  try {
    const existingData = await analytics.findOne({
      where: {
        name: "serviceSearchRecords",
      },
      attributes: ["details"],
      raw: true,
      nest: true,
    });

    if (existingData) {
      const data = existingData.details || {};
      if (!data[credentialId]) {
        data[credentialId] = {};
      } else if (data[credentialId][service]) {
        data[credentialId][service] += 1;
      } else {
        data[credentialId][service] = 1;
      }
      if (!data[credentialId][service]) {
        data[credentialId][service] = 1;
      }
      await analytics.update(
        { details: data },
        {
          where: {
            name: "serviceSearchRecords",
          },
        }
      );
    } else {
      const data = {
        [credentialId]: {
          [service]: 1,
        },
      };
      await analytics.create({
        name: "serviceSearchRecords",
        details: data,
      });
    }
    return {
      success: true,
      message: "Service search records updated successfully",
    };
  } catch (error) {
    customLog(null, "error", {
      message: "Error storing service search records",
      error,
    });
    return {
      success: false,
      message: "Error storing service search records",
      error: error.message || error,
    };
  }
};


/**
 * Stores the recent search by the user
 * @param {Object} params - The parameters for storing search records
 * @param {string} params.credentialId - The ID of the credential
 * @param {string} params.searchText - The search text entered by the user
 * @return {Promise<Object>} - A promise that resolves to the result of the operation
 */


exports.updateRecentSearches = async ({ credentialId, searchText }) => {
  const cleanedText = (searchText || "").trim().toLowerCase();

  if (cleanedText.length < 3 || /^[^a-zA-Z0-9]+$/.test(cleanedText)) return;

  const fetchRecentSearches = await analytics.findOne({ where: { name: 'recentSearches' } });

  let recentSearches = {};

  try {
    if (fetchRecentSearches?.details) {
      recentSearches = fetchRecentSearches.details;
    }
  } catch (error) {
    console.error('Error accessing recentSearches:', error);
    recentSearches = {};
  }

  const userKey = String(credentialId);
  const userSearches = recentSearches[userKey] || [];

  const filteredSearches = userSearches.filter(q => q !== cleanedText);
  const updatedSearches = [cleanedText, ...filteredSearches].slice(0, 50);

  recentSearches[userKey] = updatedSearches;

  if (fetchRecentSearches) {
    await analytics.update(
      { details: recentSearches },
      { where: { name: 'recentSearches' } }
    );
  } else {
    await analytics.create({
      name: 'recentSearches',
      details: { [userKey]: updatedSearches }
    });
  }
};

function getDateRange(filterType) {
  const today = new Date();
  let startDate, endDate;

  switch (filterType) {
    case "today":
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
      break;

    case "weekly":
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
      break;

    case "monthly":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "yearly":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      return null;
  }

  return { startDate, endDate, between: { [Op.between]: [startDate, endDate] } };
}

exports.getPartnerUsersCount = async (filterType, partnerId = null) => {
  try {
    const dateRange = getDateRange(filterType);

    // Helper: build default corporates count
    const getDefaultCorporateCount = async () => {
      const result = await credential.findOne({
        attributes: [
          [literal(`'default'`), "credentialId"],
          [literal(`'default'`), "email"],
          [literal(`COUNT(*)`), "corporateCount"]
        ],
        where: {
          role: "CORPORATE",
          registeredBy: null,
          ...(dateRange
            ? { createdAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] } }
            : {})
        },
        raw: true
      });

      return [{
        ...result,
        credential: { name: "Peko payments" }
      }];
    };

    // Case 1: main partner (default only)
    if (partnerId === "default") {
      return await getDefaultCorporateCount();
    }

    // Case 2 & 3: partner(s)
    const partners = await systemUser.findAll({
      attributes: [
        "credentialId",
        "email",
        [
          literal(`(
            SELECT COUNT(*) 
            FROM credentials c 
            WHERE c.registeredBy = systemUser.credentialId
            AND c.role = 'CORPORATE'
            ${dateRange ? `AND c.createdAt BETWEEN :startDate AND :endDate` : ""}
          )`),
          "corporateCount"
        ]
      ],
      include: [
        { model: roleAndPermissions, attributes: [], where: { roleName: "partner" } },
        { model: credential, attributes: ["name"] }
      ],
      where: {
        ...(partnerId ? { credentialId: partnerId } : {}),
        isActive: true
      },
      group: ["systemUser.credentialId", "systemUser.email", "credential.id"],
      replacements: dateRange ? { startDate: dateRange.startDate, endDate: dateRange.endDate } : {},
      raw: true,
      nest: true
    });

    // Case 3: if no partnerId given → append default corporates object
    if (!partnerId) {
      const defaultObj = await getDefaultCorporateCount();
      return [...partners, ...defaultObj];
    }

    // Case 2: specific partner only
    return partners;

  } catch (error) {
    customLog(null, "error", { message: "Error in partner users count", error });
    throw error;
  }
};


exports.serviceWiseTransactions = async (filterType, partnerId) => {
  try {
    const whereCondition = {};
    const dateRange = getDateRange(filterType);
    if (dateRange) whereCondition.createdAt = dateRange.between;

    const topTransactionsCount = 15;

    // Helper for default corporates
    const getDefaultServiceTransactions = async () => {
      return await order.findAll({
        attributes: [
          [literal(`COALESCE(serviceOperator.serviceCategory, 'Subscriptions')`), "serviceCategory"],
          [literal(`COALESCE(serviceOperator.serviceProvider, 'Subscriptions')`), "serviceProvider"],
          [fn("COUNT", col("orders.id")), "totalTransactions"],
          [fn("SUM", literal(`CASE WHEN orders.status = 'SUCCESS' THEN 1 ELSE 0 END`)), "successCount"],
          [fn("SUM", literal(`CASE WHEN orders.status = 'FAILED' THEN 1 ELSE 0 END`)), "failedCount"],
          [fn("SUM", col("orders.amountInAed")), "totalAmount"]
        ],
        include: [
          { model: ServiceOperator, attributes: [] },
          {
            model: credential,
            attributes: [],
            required: true,
            where: { role: "CORPORATE", registeredBy: null }
          }
        ],
        where: whereCondition,
        group: [
          literal(`COALESCE(serviceOperator.serviceCategory, 'Subscriptions')`),
          literal(`COALESCE(serviceOperator.serviceProvider, 'Subscriptions')`)
        ],
        order: [[literal("totalTransactions"), "DESC"]],
        limit: topTransactionsCount,
        subQuery: false,
        raw: true
      });
    };

    // Case 1: Default only
    if (partnerId === "default") {
      return await getDefaultServiceTransactions();
    }

    // Case 2 & 3: Partners
    const credentialWhere = partnerId ? { registeredBy: partnerId } : {};

    const partnerData = await order.findAll({
      attributes: [
        [literal(`COALESCE(serviceOperator.serviceCategory, 'Subscriptions')`), "serviceCategory"],
        [literal(`COALESCE(serviceOperator.serviceProvider, 'Subscriptions')`), "serviceProvider"],
        [fn("COUNT", col("orders.id")), "totalTransactions"],
        [fn("SUM", literal(`CASE WHEN orders.status = 'SUCCESS' THEN 1 ELSE 0 END`)), "successCount"],
        [fn("SUM", literal(`CASE WHEN orders.status = 'FAILED' THEN 1 ELSE 0 END`)), "failedCount"],
        [fn("SUM", col("orders.amountInAed")), "totalAmount"]
      ],
      include: [
        { model: ServiceOperator, attributes: [] },
        { model: credential, attributes: [], required: true, where: credentialWhere }
      ],
      where: whereCondition,
      group: [
        literal(`COALESCE(serviceOperator.serviceCategory, 'Subscriptions')`),
        literal(`COALESCE(serviceOperator.serviceProvider, 'Subscriptions')`)
      ],
      order: [[literal("totalTransactions"), "DESC"]],
      limit: topTransactionsCount,
      subQuery: false,
      raw: true
    });

    // Case 3: All partners + default
    if (!partnerId) {
      const defaultData = await getDefaultServiceTransactions();
      const merged = [...partnerData, ...defaultData];

      const aggregated = merged.reduce((acc, curr) => {
        const key = `${curr.serviceCategory}_${curr.serviceProvider}`;
        if (!acc[key]) {
          acc[key] = { ...curr };
        
          acc[key].totalTransactions = Number(curr.totalTransactions);
          acc[key].successCount = Number(curr.successCount);
          acc[key].failedCount = Number(curr.failedCount);
          acc[key].totalAmount = Number(curr.totalAmount);
        } else {
          acc[key].totalTransactions += Number(curr.totalTransactions);
          acc[key].successCount += Number(curr.successCount);
          acc[key].failedCount += Number(curr.failedCount);
          acc[key].totalAmount += Number(curr.totalAmount);
        }
        return acc;
      }, {});

      const finalData = Object.values(aggregated)
        .sort((a, b) => b.totalTransactions - a.totalTransactions)
        .slice(0, 15);

      return finalData;
    }

    // Case 2: Specific partner
    return partnerData;

  } catch (error) {
    customLog(null, "error", { message: "Error in serviceWiseTransactions", error });
    throw error;
  }
};


exports.usersAnalytics = async (filterType, partnerId) => {
  try {
    const whereClause = { role: "CORPORATE" };

    // Partner filter
    if (partnerId) {
      if (partnerId === "default") {
        // Default means all corporates (no registeredBy filter)
        whereClause.registeredBy = null;
      } else {
        whereClause.registeredBy = partnerId;
      }
    }

    // Date filter (reusing helper)
    const dateRange = getDateRange(filterType);
    if (dateRange) whereClause.createdAt = dateRange.between;

    // Analytics query
    return await credential.findAll({
      attributes: [
        [fn("YEAR", col("createdAt")), "year"],
        [fn("MONTH", col("createdAt")), "month"],
        [col("registeredBy"), "partnerId"],
        [fn("COUNT", col("id")), "userCount"],
      ],
      where: whereClause,
      group: [
        "registeredBy",
        fn("YEAR", col("createdAt")),
        fn("MONTH", col("createdAt"))
      ],
      order: [
        [fn("YEAR", col("createdAt")), "ASC"],
        [fn("MONTH", col("createdAt")), "ASC"]
      ],
      raw: true,
    });
  } catch (error) {
    customLog(null, 'error', { message: 'Analytics Error', error })
    throw error;
  }
};


exports.gmvAnalytics = async (filterType, credentialId) => {
  try {
    // Base filters
    const whereClause = { status: "SUCCESS" };

    // Date filter (reuse helper)
    const dateRange = getDateRange(filterType);
    if (dateRange) whereClause.createdAt = dateRange.between;

    // Partner filter
    const credentialWhere = credentialId ? { registeredBy: credentialId } : {};

    // GMV analytics query
    return await order.findAll({
      attributes: [
        [fn("YEAR", col("orders.createdAt")), "year"],
        [fn("MONTH", col("orders.createdAt")), "month"],
        [fn("SUM", col("orders.amountInAed")), "gmv"],
      ],
      include: [
        {
          model: credential,
          attributes: [],
          required: true,
          where: credentialWhere,
        },
      ],
      where: whereClause,
      group: [
        fn("YEAR", col("orders.createdAt")),
        fn("MONTH", col("orders.createdAt")),
      ],
      order: [
        [fn("YEAR", col("orders.createdAt")), "ASC"],
        [fn("MONTH", col("orders.createdAt")), "ASC"],
      ],
      raw: true,
    });
  } catch (error) {
    customLog(null, 'error', { message: 'Error in gmvAnalytics', error })
    throw error;
  }
};


exports.monthlyCorporateUsers = async (partnerId) => {
  try {
    // Always filter for corporate role
    const whereClause = { role: "CORPORATE" };

    // Restrict to current year
    const currentYear = new Date().getFullYear();
    whereClause.createdAt = {
      [Op.gte]: new Date(`${currentYear}-01-01`),
      [Op.lte]: new Date(`${currentYear}-12-31`),
    };

    // Partner filter
    if (partnerId) {
      if (partnerId === "default") {
        // Default → all corporates (no registeredBy filter)
        whereClause.registeredBy = null;
      } else {
        whereClause.registeredBy = partnerId;
      }
    }

    // Query DB for monthly counts
    const results = await credential.findAll({
      attributes: [
        [fn("MONTH", col("createdAt")), "month"],
        [fn("COUNT", col("id")), "userCount"],
      ],
      where: whereClause,
      group: [fn("MONTH", col("createdAt"))],
      order: [[fn("MONTH", col("createdAt")), "ASC"]],
      raw: true,
    });

    const countByMonth = {};
    results.forEach(r => {
      countByMonth[r.month] = parseInt(r.userCount, 10);
    });

    // Generate full list (Jan–Dec), filling missing months with 0
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const response = months.map((m, i) => ({
      month: m,
      users: countByMonth[i + 1] || 0
    }));

    return response;
  } catch (error) {
    customLog(null, "error", { message: "Error in monthlyCorporateUsers", error });
    throw error;
  }
};

exports.monthlyGmvAnalytics = async (credentialId) => {
  try {
    const whereClause = { status: "SUCCESS" };

    // Partner filter
    let credentialWhere = { role: "CORPORATE" };
    if (credentialId) {
      if (credentialId === "default") {
        credentialWhere = { registeredBy: null };
      } else {
        credentialWhere = { registeredBy: credentialId };
      }
    }

    // Fetch GMV + transactions for current year
    const gmvData = await order.findAll({
      attributes: [
        [fn("MONTH", col("orders.createdAt")), "month"],
        [fn("SUM", col("orders.amountInAed")), "gmv"],
        [fn("COUNT", col("orders.id")), "transactions"], // 🔥 add transactions count
      ],
      include: [
        {
          model: credential,
          attributes: [],
          required: true,
          where: credentialWhere,
        },
      ],
      where: {
        ...whereClause,
        [Op.and]: [
          where(fn("YEAR", col("orders.createdAt")), new Date().getFullYear()),
        ],
      },
      group: [fn("MONTH", col("orders.createdAt"))],
      order: [[fn("MONTH", col("orders.createdAt")), "ASC"]],
      raw: true,
    });

    // Month names
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const result = months.map((name, index) => {
      const monthData = gmvData.find((d) => parseInt(d.month) === index + 1);
      return {
        month: name,
        gmv: monthData ? parseFloat(monthData.gmv).toFixed(2) : "0.00",
        transactions: monthData ? parseInt(monthData.transactions) : 0,
      };
    });

    return result;
  } catch (error) {
    customLog(null, "error", { message: "Error in monthlyGmvAnalytics", error });
    throw error;
  }
};


exports.getPackageStats = async (partnerId, statusFilter = "all") => {
  try {
    let whereCondition = "1=1";
    let replacements = {};

    if (partnerId) {
      if (partnerId === "default") {
        whereCondition += " AND c.registeredBy IS NULL";
      } else {
        whereCondition += " AND c.registeredBy = :partnerId";
        replacements.partnerId = partnerId;
      }
    }

    if (statusFilter === "active") {
      whereCondition += " AND cs.status = 'ACTIVE'";
    } else if (statusFilter === "expired") {
      whereCondition += " AND cs.status = 'EXPIRED'";
    }

    const query = `
      SELECT 
        cs.packageName,
        ROUND(SUM(cs.subscriptionPrice), 2) AS totalSubscriptionPrice,
        COUNT(cs.id) AS subscriptionCount
      FROM corporateSubscriptions cs
      JOIN credentials c ON cs.credentialId = c.id
      WHERE ${whereCondition}
      GROUP BY cs.packageName
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    return results;
  } catch (err) {
    customLog(null, 'error', {err})
    throw err;
  }
};
