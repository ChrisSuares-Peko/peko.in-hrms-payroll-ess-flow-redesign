const transaction = require("./../entities/transaction");
const orders = require("./../entities/order");
const serviceOperator = require("./../entities/serviceOperator");
const moment = require("moment");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
let sequelizeConfig = require('../../configs/database/index');
const { safeJsonParse } = require('../../utils/safeJsonParse');
const { customLog } = require('../../utils/loggerHelper');

const transactionsExcelReport = async (params) => {
  
  try {
   
    let { credentialId, from, to, partnerId } = params;
   
    let whereClause = {
      transactionDate: {
        [Op.between]: [from, to],
      },
    };
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    let registeredByClause = {};
  
    if (typeof partnerId !== "undefined") {
      registeredByClause.registeredBy = partnerId;
    }
    let includeOptions = [
      {
        model: serviceOperator,
        attributes:["serviceProvider"]
       
       
      },
      // {
      //   model: credential,
      //   attributes:["credentialId"]
      
      // },
      {
        model: orders,
        attributes:["paymentMode","amountInINR"]
       
      },
    ];
   
   const data = await transaction.findAndCountAll({
      include: includeOptions,
      attributes:["transactionDate","providerId","corporateTxnId","transactionCategory","status"],
      where: whereClause,
      raw: true,
      nest: true,
    });
    
    // Defensive check for data.rows
    if (!data || !data.rows || !Array.isArray(data.rows)) {
      customLog(null, "info", { 
        message: "transactionsExcelReport: No rows returned or invalid format",
        hasData: !!data,
        hasRows: !!(data && data.rows),
        rowsType: data && data.rows ? typeof data.rows : 'undefined',
        params
      });
      return [];
    }
    
    if (data.rows.length === 0) {
      return [];
    }
    
    let finalData = [];
  data.rows.forEach(function (limitData) {
    const paymentMode = limitData.order.paymentMode;
    const status = limitData.status;
    const amount = limitData.order.amountInINR;

      finalData.push({
        "Date/Time": limitData.transactionDate
          ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
          : "Not Available",
        "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
        Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
        Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
        Amount: !isNaN(parseFloat(amount)) ? `${parseFloat(amount).toFixed(2)} ₹` : "0.00 ₹", // Formatting amount
        "Payment Mode": paymentMode,
        Status: status,
      });
  });
  return finalData;
    

  } catch (error) {
    console.error(error,"errror");
    return [];
  }
};

const transactionsExcelReportAdmin = async (params) => {
  // Function to fetch transaction reports for admin with optional partnerId filtering
  try {
    let { from, to, partnerId } = params;
    const query = `
      SELECT 
        transaction.remarks, 
        transaction.transactionDate, 
        transaction.providerId, 
        transaction.corporateTxnId, 
        transaction.transactionCategory, 
        transaction.credentialId, 
        serviceOperator.serviceProvider AS serviceOperatorServiceProvider, 
        credential.id AS credentialId, 
        credential.name AS credentialName, 
        credential.partnerId AS credentialPartnerId, 
        orderAlias.paymentMode AS orderPaymentMode, 
        orderAlias.amountInINR AS orderAmountInINR, 
        corporateUsers.name As corporateUsersName, 
        corporateUsers.contactPersonName As contactPersonName
      FROM 
        transactions AS transaction 
        LEFT OUTER JOIN serviceOperators AS serviceOperator ON transaction.serviceOperatorId = serviceOperator.id 
        LEFT OUTER JOIN credentials AS credential ON transaction.credentialId = credential.id 
        LEFT OUTER JOIN corporateUsers AS corporateUsers ON transaction.credentialId = corporateUsers.credentialId 
        LEFT OUTER JOIN orders AS orderAlias ON transaction.orderId = orderAlias.id 
      WHERE 
        transaction.transactionDate BETWEEN :from 
        AND :to 
        AND transaction.transactionCategory NOT IN (
          'FUND TRANSFER', 'FUND REVERSAL', 
          'ONLINE TRANSFER'
        ) 
        AND transaction.remarks NOT IN ('REFUND', 'REFUNDED')
    `;
    const data = await sequelizeConfig.query(query, {
      replacements: { from,to },
      type: Sequelize.QueryTypes.SELECT,
  });
  
    // Defensive check for data
    if (!data || !Array.isArray(data)) {
      customLog(null, "info", { 
        message: "transactionsExcelReportAdmin: No data returned or invalid format",
        dataType: typeof data,
        params
      });
      return [];
    }
    
    if (data.length === 0) {
      return [];
    }
    
    let finalData = [];
    data.forEach(function (limitData) {
      const paymentMode = limitData.orderPaymentMode;
      const status = limitData.remarks;
      const amount = limitData.orderAmountInINR;
      const fullName = (limitData.contactPersonName)
      ? `${limitData.contactPersonName}`
      : "Not Available";
      const partnerName = limitData.credentialPartnerId === partnerId 
      ? limitData.credentialName 
      : "Peko";
        finalData.push({
          "Date/Time": limitData.transactionDate
            ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
            : "Not Available",
          "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
          "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
          Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
          Operator: limitData.serviceOperatorServiceProvider ? limitData.serviceOperatorServiceProvider : "Not Available",
          Amount: parseFloat(amount).toFixed(2)+ " ₹" , // Formatting amount
          "Payment Mode": paymentMode,
          Status: status||'PENDING',
          "Partner Name": partnerName, // Adding Partner Name,
          "Corporate Name": limitData.corporateUsersName ? limitData.corporateUsersName : "Not Available",
          "POC Name": fullName,
        });
    });
    return finalData;


  } catch (error) {
    customLog(null, "error", { 
      message: "Failed to fetch transactions excel report admin", 
      error,
      params
    });
    throw error;
  }
};
const transactionsExcelReportAdminNew = async (params) => {
  // Function to fetch new version of transaction reports for admin
  try {
    let { from, to, partnerId } = params;
    const query = `
      SELECT 
        transaction.remarks, 
        transaction.transactionDate, 
        transaction.providerId, 
        transaction.corporateTxnId, 
        transaction.transactionCategory, 
        transaction.credentialId, 
        serviceOperator.serviceProvider AS serviceOperatorServiceProvider, 
        credential.id AS credentialId, 
        credential.name AS credentialName, 
        credential.partnerId AS credentialPartnerId, 
        orderAlias.paymentMode AS orderPaymentMode, 
        orderAlias.amountInINR AS orderAmountInINR, 
        corporateUsers.name As corporateUsersName, 
        corporateUsers.contactPersonName As contactPersonName
      FROM 
        transactions AS transaction 
        LEFT OUTER JOIN serviceOperators AS serviceOperator ON transaction.serviceOperatorId = serviceOperator.id 
        LEFT OUTER JOIN credentials AS credential ON transaction.credentialId = credential.id 
        LEFT OUTER JOIN corporateUsers AS corporateUsers ON transaction.credentialId = corporateUsers.credentialId 
        LEFT OUTER JOIN orders AS orderAlias ON transaction.orderId = orderAlias.id 
      WHERE 
        transaction.transactionDate BETWEEN :from 
        AND :to 
        AND transaction.transactionCategory NOT IN (
          'FUND TRANSFER', 'FUND REVERSAL', 
          'ONLINE TRANSFER'
        ) 
        AND transaction.remarks NOT IN ('REFUND', 'REFUNDED')
    `;
    const data = await sequelizeConfig.query(query, {
      replacements: { from,to },
      type: Sequelize.QueryTypes.SELECT,
  });
  
    // Defensive check for data
    if (!data || !Array.isArray(data)) {
      customLog(null, "info", { 
        message: "transactionsExcelReportAdmin: No data returned or invalid format",
        dataType: typeof data,
        params
      });
      return [];
    }
    
    if (data.length === 0) {
      return [];
    }
    
    let finalData = [];
    data.forEach(function (limitData) {
      const paymentMode = limitData.orderPaymentMode;
      const status = limitData.remarks;
      const amount = limitData.orderAmountInINR;
      const fullName = (limitData.contactPersonName)
      ? `${limitData.contactPersonName}`
      : "Not Available";
      const partnerName = limitData.credentialPartnerId === partnerId 
      ? limitData.credentialName 
      : "Peko";
        finalData.push({
          "Date/Time": limitData.transactionDate
            ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
            : "Not Available",
          "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
          "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
          Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
          Operator: limitData.serviceOperatorServiceProvider ? limitData.serviceOperatorServiceProvider : "Not Available",
          Amount: parseFloat(amount).toFixed(2)+ " ₹" , // Formatting amount
          "Payment Mode": paymentMode,
          Status: status||'PENDING',
          "Partner Name": partnerName, // Adding Partner Name,
          "Corporate Name": limitData.corporateUsersName ? limitData.corporateUsersName : "Not Available",
          "POC Name": fullName,
        });
    });
    return finalData;


  } catch (error) {
    customLog(null, "error", { 
      message: "Failed to fetch transactions excel report admin new", 
      error,
      params
    });
    throw error;
  }
};
const transactionsSubscriptionExcelReportAdminNew = async (params) => {
  try {

    let { from, to, partnerId } = params;
    const query = `
    SELECT 
    orderAlias.corporateTxnId,
    orderAlias.transactionDate,
    orderAlias.amountInINR,
    orderAlias.orderResponse,
    orderAlias.paymentMode,
    orderAlias.status,
    credential.name,
    credential.partnerId as partnerId,
    crb.name AS crbCustomerName,
    orderAlias.credentialId AS custcredentialId,
    corporateUser.contactPersonName,
    corporateUser.name as customerName
FROM
    orders AS orderAlias
        LEFT OUTER JOIN
    credentials AS credential ON credential.id = orderAlias.credentialId
        LEFT OUTER JOIN
    credentials AS crb ON credential.registeredBy = crb.id
        LEFT OUTER JOIN
    corporateUsers AS corporateUser ON orderAlias.credentialId = corporateUser.credentialId
WHERE
    optional IS NOT NULL
        AND orderAlias.transactionDate BETWEEN :from AND :to`;
        const data = await sequelizeConfig.query(query, {
          replacements: { from,to },
          type: Sequelize.QueryTypes.SELECT,
          raw: true,
      });

      if (!data || data.length === 0) return [];
    
    const finalData = data.map((limitData) => {
      const orderResponse = safeJsonParse(limitData.orderResponse, {}, 'transactionsSubscriptionExcelReportAdminNew');
      
      return {
        "Date/Time": limitData.transactionDate
          ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
          : "Not Available",
        "Order ID": limitData.corporateTxnId || "Not Available",
        "Subscription": orderResponse?.serviceName || "Not Available",
        "Billing Type": orderResponse?.billingType || "Not Available",
        Amount: !isNaN(parseFloat(limitData.amountInINR)) 
          ? `${parseFloat(limitData.amountInINR).toFixed(2)} ₹` 
          : "0.00 ₹",
        "Payment Mode": limitData.paymentMode || "Not Available",
        Status: limitData.status,
        "Partner Name": (partnerId === undefined && limitData.crbCustomerName)
          ? limitData.crbCustomerName
          : (limitData.partnerId === partnerId ? limitData.name : "Peko"),
        "Corporate Name": limitData.customerName || "Not Available",
        "POC Name": limitData.contactPersonName || "Not Available",
      };
    });
    
    return finalData;

  } catch (error) {
    customLog(null, "error", { 
      message: "Failed to fetch subscription transactions report", 
      error,
      params
    });
    throw error;
  }
};

const corporateTransactionsExcelReport = async (params) => {
  
  try {
    let { credentialId, from, to, partnerId } = params;
    let whereClause = {
      optional:{[Op.in]:['SUBSCRIPTION','WHATSAPP-SUBSCRIPTION','SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION']},
      transactionDate: {
        [Op.between]: [from, to],
      },
    };
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    let registeredByClause = {};
  
    if (typeof partnerId !== "undefined") {
      registeredByClause.registeredBy = partnerId;
    }
   const data = await orders.findAll({
      // include: includeOptions,
      attributes:["corporateTxnId","transactionDate","amountInINR","orderResponse","paymentMode","status"],
      where: whereClause,
      raw: true,
      nest: true,
    });
    
    if (!data || !Array.isArray(data)) {
      customLog(null, "info", { 
        message: "corporateTransactionsExcelReport: No data returned or invalid format",
        dataType: typeof data,
        params
      });
      return [];
    }
    
    if (data.length === 0) {
      return [];
    }
    
    const finalData = data.map((limitData) => {
      const orderResponse = safeJsonParse(limitData.orderResponse, {}, 'transactionsExcelReportAdmin');

      return {
        "Date/Time": limitData.transactionDate
          ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
          : "Not Available",
        "Order ID": limitData.corporateTxnId || "Not Available",
        "Subscription": orderResponse?.serviceName || "Not Available",
        "Billing Type": orderResponse?.billingType || "Not Available",
        Amount: !isNaN(parseFloat(limitData.amountInINR)) 
          ? `${parseFloat(limitData.amountInINR).toFixed(2)} ₹` 
          : "0.00 ₹",
        "Payment Mode": limitData.paymentMode,
        Status: limitData.status,
      };
    });
    
    return finalData;  

  } catch (error) {
    customLog(null, "error", { 
      message: "Failed to fetch corporate transactions report", 
      error,
      params
    });
    throw error;
  }
};
module.exports = {
  transactionsExcelReport,
  transactionsExcelReportAdmin,
  transactionsExcelReportAdminNew,
  transactionsSubscriptionExcelReportAdminNew,
  corporateTransactionsExcelReport
};
