const { Op, literal } = require("sequelize")
const sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const transaction = require("../entities/transaction");
const orders = require("../entities/order");
const {  formatNumberWithLocalString } = require("../../utils/formatter");
const credential = require("../entities/credential");
const { handleSortFields } = require("../../utils/sortHandle");

exports.findAllRecordsOrderListAndCountForAdmin = asyncHandler(async (params) => {
  let {
    from,
    to,
    limit,
    offset,
    searchText,
    sort,
    column,
    status,
    corporateId,
    subCorporateUserId,
    
    registeredBy
  } = params;

  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());

  let whereClause = {
    transactionCategory: "Verification Suite",
    status: { [Op.in]: ["SUCCESS", "REFUNDED"] },
  };
  
  if (safeSearch) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${safeSearch}%` } },
      { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
      { "$credential.name$": { [Op.like]: `%${safeSearch}%` } },
      { "$credential.username$": { [Op.like]: `%${safeSearch}%` } },
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("order.amountInINR")),
        { [Op.like]: `%${safeSearch}%` }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("order.paymentMode")),
        { [Op.like]: `%${safeSearch}%` }
      ),
      sequelize.where(
        sequelize.literal(`
          IF(
            JSON_VALID(order.orderResponse),
            LOWER(JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType'))),
            NULL
          )
        `),
        { [Op.like]: `%${safeSearch}%` }
      ),
    ];
  }
  

  if (status && status !== 'ALL') {
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.literal(`
          CASE
            WHEN JSON_VALID(order.orderResponse) AND (
              JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.Result.status')) IN ('VALID', 'SUCCESS')
              OR JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.Result.account_status')) = 'VALID'
              OR JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.Result.response[0].responseStatus')) = 'SUCCESS'
              OR JSON_EXTRACT(order.orderResponse, '$.Result.valid') = true
            )
            THEN 'VALID'
            ELSE 'INVALID'
          END
          `),          
        status.toUpperCase() === 'VALID' ? 'VALID' : 'INVALID'
      )
    ];
  }

  if (from && to) {
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {

      [Op.between]: [from, tomorrow]
    };
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
 

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  if (registeredBy)
    whereClause.registeredBy = registeredBy

  return await transaction.findAndCountAll({
    attributes: [
      "createdAt",
      "id",
      "transactionCategory",
      "corporateTxnId",
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],
      [literal('order.orderResponse'), 'orderResponse'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType')), NULL)`), 'VerificationType'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.Accesskey')), NULL)`), 'Accesskey'],
      
    ],
    include: [
      {
        model: orders,
        attributes: [] // Prevent including the whole order object, extract only the necessary fields above
      },
       {
                      model: credential,
                      attributes: ["name", "email", 'username'],
                      include: [
                        {
                          // Self-reference join to get the name of the registeredBy user
                          model: credential, // Referencing the same `credential` model
                          as: 'registeredByCredential', // Alias for the registeredBy relation
                          attributes: ['name'], // Assuming 'username' is the name field
                        }
                      ],
                  },
     
    ],
    where: whereClause,
    order: [
      [column, sort]
    ],
    limit,
    offset
  });

});

exports.findAllRecordsOrderListAndCount = asyncHandler(async (params) => {
  const {
    from,
    to,
    limit,
    offset,
    searchText = '',
    sort = 'DESC',
    column = 'createdAt',
    corporateId,
    status,
    subCorporateUserId,
  } = params;
  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike(searchText.toLowerCase());
  const whereClause = {
    transactionCategory: "Verification Suite",
    status: {
      [Op.in]: ["SUCCESS", "REFUNDED"],
    },
  };

  if (safeSearch) {
    whereClause[Op.or] = [
      {
        id: {
          [Op.like]: `%${safeSearch}%`,
        },
      },
      {
        corporateTxnId: {
          [Op.like]: `%${safeSearch}%`,
        },
      },
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("order.amountInINR")),
        { [Op.like]: `%${safeSearch}%` }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("order.paymentMode")),
        { [Op.like]: `%${safeSearch}%` }
      ),
      sequelize.where(
        sequelize.literal(`
          IF(
            JSON_VALID(order.orderResponse),
            LOWER(JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType'))),
            NULL
          )
        `),
        { [Op.like]: `%${safeSearch}%` }
      ),
    ];
  }
  // Add status filter
  if (status && status !== 'ALL') {
    const validStatusCheck = `
      CASE
        WHEN JSON_VALID(order.orderResponse) AND (
          order.orderResponse->>'$.Result.status' IN ('VALID', 'SUCCESS', 'true', '1')
          OR order.orderResponse->>'$.Result.account_status' = 'VALID'
          OR order.orderResponse->>'$.Result.response[0].responseStatus' = 'SUCCESS'
          OR order.orderResponse->>'$.Result.valid' = 'true'
        )
        THEN 'VALID'
        ELSE 'INVALID'
      END
    `;
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.literal(validStatusCheck),
        status.toUpperCase() === 'VALID' ? 'VALID' : 'INVALID'
      ),
    ];
  }

  // Date range filter
  if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, endDate],
    };
  }

  // Corporate filters
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  return await transaction.findAndCountAll({
    attributes: [
      'createdAt',
      'transactionCategory',
      'corporateTxnId',
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],
      [literal('order.orderResponse'), 'orderResponse'],
      [
        literal(`
          IF(
            JSON_VALID(order.orderResponse),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType')),
            NULL
          )
        `),
        'VerificationType',
      ],
      [
        literal(`
          IF(
            JSON_VALID(order.orderResponse),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.Accesskey')),
            NULL
          )
        `),
        'Accesskey',
      ],
    ],
    include: [
      {
        model: orders,
        attributes: [],
      },
    ],
    where: whereClause,
    order: [[column, sort]],
    limit,
    offset,
  });
});



exports.verificationTransactionsExcelCSV = asyncHandler(async (params) => {
  let {
    from,
    to,
    searchText,
    sort,
    corporateId,
    subCorporateUserId,
    registeredBy,
    sortField,
    status,
    credentialId
  } = params;

  let order = handleSortFields(sortField, sort);
  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());
  
  let whereClause = {
    transactionCategory: "Verification Suite",
    status: { [Op.in]: ["SUCCESS", "REFUNDED"] },
  };
  
  if (safeSearch) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${safeSearch}%` } },
      { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
      sequelize.where(sequelize.col("order.amountInINR"), {
        [Op.like]: `%${safeSearch}%`,
      }),
      sequelize.where(sequelize.col("order.paymentMode"), {
        [Op.like]: `%${safeSearch}%`,
      }),
      sequelize.where(
        sequelize.literal(
          "IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.VerificationType')), NULL)"
        ),
        { [Op.like]: `%${safeSearch}%` }
      ),
    ];
  }
  

  if (credentialId) {
    whereClause.credentialId = credentialId;
  }

  if (status && status !== 'ALL') {
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.literal(`CASE
          WHEN order.orderResponse->'$.Result.status' IN ('VALID', 'SUCCESS') 
          OR order.orderResponse->'$.Result.account_status' = 'VALID' 
          OR order.orderResponse->'$.Result.response[0].responseStatus' = 'SUCCESS' 
          OR order.orderResponse->'$.Result.valid' = true 
          THEN 'VALID' 
          ELSE 'INVALID' 
        END`),
        status.toUpperCase() === 'VALID' ? 'VALID' : 'INVALID'
      )
    ];
  }

  if (from && to) {
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, tomorrow]
    };
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  let whereClauseCredential = {};
  if (registeredBy) {
    whereClauseCredential.registeredBy = registeredBy;
  }

  const data = await transaction.findAndCountAll({
    attributes: [
      "createdAt",
      "transactionCategory",
      "corporateTxnId",
      "status",
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],
      [literal('order.orderResponse'), 'orderResponse'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType')), NULL)`), 'VerificationType'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.Accesskey')), NULL)`), 'Accesskey'],
    ],
    include: [
      {
        model: orders,
        attributes: []
      },
      {
        model: credential,
        attributes: ["name", "email", "username"],
        where: whereClauseCredential,
        include: [
          {
            model: credential,
            as: 'registeredByCredential',
            attributes: ['name'],
          }
        ],
      },
    ],
    where: whereClause,
    order: order,
    raw: true,
  });

  // ✅ Deduplicate by corporateTxnId, prefer REFUNDED over SUCCESS
  const dedupedMap = new Map();

  data.rows.forEach((row) => {
    const txnId = row.corporateTxnId;
    const existing = dedupedMap.get(txnId);
    if (!existing || (row.status === 'REFUNDED' && existing.status !== 'REFUNDED')) {
      dedupedMap.set(txnId, row);
    }
  });

  let finalData = [];

  Array.from(dedupedMap.values()).forEach(function (limitData) {
    let orderResponse;
    try {
      orderResponse = JSON.parse(limitData.orderResponse || '{}');
    } catch (err) {
      orderResponse = {};
    }

    const inputDetails = orderResponse?.InputDetails || {};
    const result = orderResponse?.Result || {};
    const accessKey = inputDetails?.Accesskey || '';
    const verificationType = inputDetails?.VerificationType || 'Not Available';

    const isAadhaarOCR = accessKey.toLowerCase() === 'aadhar_ocr_verify';

    const formatKey = (key) => {
      if (key.toLowerCase() === 'dob') return 'DOB';
      if (key === 'dl_number') return 'DL Number';
      return formatServiceField(key === 'phone' ? 'Mobile Number' : key);
    };

    let inputDetailsFormatted;
    if (isAadhaarOCR) {
      inputDetailsFormatted = Object.entries(result)
        .filter(([key]) =>
          !['reference_id', 'status', 'verification_id'].includes(key.toLowerCase())
        )
        .map(([key, value]) => `${formatKey(key)}: ${value}`)
        .join(', ');
    } else {
      inputDetailsFormatted = Object.entries(inputDetails)
        .filter(([key]) =>
          !['accesskey', 'verificationtype'].includes(key.toLowerCase())
        )
        .map(([key, value]) => `${formatKey(key)}: ${value}`)
        .join(', ');
    }

    finalData.push({
      "Transaction Date": limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
      "Transaction ID": limitData.corporateTxnId || 'Not Available',
      "Corporate ID": limitData["credential.username"] || 'Not Available',
      "Corporate Name": limitData["credential.name"] || 'Not Available',
      "Partner Name": limitData["credential.registeredByCredential.name"] || 'Not Available',
      "Verification Type": verificationType || 'Not Available',
      "Input Details": inputDetailsFormatted || 'Not Available',
      "Result": getResult(orderResponse),
      Amount: limitData.amountInINR ? "₹ " + formatNumberWithLocalString(limitData.amountInINR) : "₹ 0.00",
      Status: limitData.status || "Not Available",
    });
  });

  return finalData;
});

exports.verificationTransactionsExcelCSVCorporate = asyncHandler(async (params) => {
  let {
    from,
    to,
    searchText,
    sort,
    corporateId,
    subCorporateUserId,
    registeredBy,
    sortField,
    status,
    credentialId,
  } = params;

  let order = handleSortFields(sortField, sort);

  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());
  
  let whereClause = {
    transactionCategory: "Verification Suite",
    status: { [Op.in]: ["SUCCESS", "REFUNDED"] },
  };
  
  if (safeSearch) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${safeSearch}%` } },
      { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
      sequelize.where(sequelize.col("order.amountInINR"), {
        [Op.like]: `%${safeSearch}%`,
      }),
      sequelize.where(sequelize.col("order.paymentMode"), {
        [Op.like]: `%${safeSearch}%`,
      }),
      sequelize.where(
        sequelize.literal(`
          IF(
            JSON_VALID(order.orderResponse),
            LOWER(JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType'))),
            NULL
          )
        `),
        { [Op.like]: `%${safeSearch}%` }
      ),
    ];
  }
  
  if (credentialId) {
    whereClause.credentialId = credentialId;
  }

  if (status && status !== 'ALL') {
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.literal(`CASE
          WHEN order.orderResponse->'$.Result.status' IN ('VALID', 'SUCCESS') 
          OR order.orderResponse->'$.Result.account_status' = 'VALID' 
          OR order.orderResponse->'$.Result.response[0].responseStatus' = 'SUCCESS' 
          OR order.orderResponse->'$.Result.valid' = true 
          THEN 'VALID' 
          ELSE 'INVALID' 
        END`),
        status.toUpperCase() === 'VALID' ? 'VALID' : 'INVALID'
      )
    ];
  }

  if (from && to) {
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, tomorrow]
    };
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  let whereClauseCredential = {};
  if (registeredBy) {
    whereClauseCredential.registeredBy = registeredBy;
  }

  const data = await transaction.findAndCountAll({
    attributes: [
      "createdAt",
      "transactionCategory",
      "corporateTxnId",
      "status",
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],
      [literal('order.orderResponse'), 'orderResponse'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.VerificationType')), NULL)`), 'VerificationType'],
      [literal(`IF(JSON_VALID(order.orderResponse), JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.InputDetails.Accesskey')), NULL)`), 'Accesskey'],
      
    ],
    include: [
      {
        model: orders,
        attributes: []
      },
      {
        model: credential,
        attributes: ["name", "email", "username"],
        where: whereClauseCredential,
        include: [
          {
            model: credential,
            as: 'registeredByCredential',
            attributes: ['name'],
          }
        ],
      },
    ],
    where: whereClause,
    order: order,
    raw: true,
  });

  // 🔁 Deduplicate by corporateTxnId, prefer REFUNDED over SUCCESS
  const dedupedMap = new Map();

  data.rows.forEach((row) => {
    const txnId = row.corporateTxnId;
    const existing = dedupedMap.get(txnId);

    if (!existing || (row.status === 'REFUNDED' && existing.status !== 'REFUNDED')) {
      dedupedMap.set(txnId, row);
    }
  });

  let finalData = [];

  Array.from(dedupedMap.values()).forEach(function (limitData) {
    const orderResponse = JSON.parse(limitData.orderResponse || '{}');
    const inputDetails = orderResponse?.InputDetails || {};
    const result = orderResponse?.Result || {};
    const accessKey = inputDetails?.Accesskey || '';
    const verificationType = inputDetails?.VerificationType || 'Not Available';

    const isAadhaarOCR = accessKey.toLowerCase() === 'aadhar_ocr_verify';

    const formatKey = (key) => {
      if (key.toLowerCase() === 'dob') return 'DOB';
      if (key === 'dl_number') return 'DL Number';
      return formatServiceField(key === 'phone' ? 'Mobile Number' : key);
    };

    let inputDetailsFormatted;
    if (isAadhaarOCR) {
      inputDetailsFormatted = Object.entries(result)
        .filter(([key]) =>
          !['reference_id', 'status', 'verification_id'].includes(key.toLowerCase())
        )
        .map(([key, value]) => `${formatKey(key)}: ${value}`)
        .join(', ');
    } else {
      inputDetailsFormatted = Object.entries(inputDetails)
        .filter(([key]) =>
          !['accesskey', 'verificationtype'].includes(key.toLowerCase())
        )
        .map(([key, value]) => `${formatKey(key)}: ${value}`)
        .join(', ');
    }

    finalData.push({
      "Transaction Date": limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
      "Verification Type": verificationType,
      "Transaction ID": limitData.corporateTxnId || 'Not Available',
      "Input Details": inputDetailsFormatted || 'Not Available',
      Amount: limitData.amountInINR ? "₹ " + formatNumberWithLocalString(limitData.amountInINR) : "₹ 0.00",
      "Result": getResult(orderResponse),
      Status: limitData.status || "Not Available",
    });
  });

  return finalData;
});



function getResult(orderResponse) {
  // Check the conditions for VALID or INVALID
  if (orderResponse?.Result?.status === 'VALID' || 
      orderResponse?.Result?.status === 'SUCCESS' ||
      orderResponse?.Result?.account_status === 'VALID' ||
      orderResponse?.Result?.response?.[0]?.responseStatus === 'SUCCESS' ||
      orderResponse?.Result?.valid === true) {
    return 'VALID'; // Return 'VALID' if any of the conditions are met
  }
  return 'INVALID'; // Otherwise, return 'INVALID'
}


function formatServiceField(text) {
  const knownAcronyms = ['PAN', 'CIN', 'DIN', 'DL', 'IFSC', 'GST', 'KYC'];
  if (!text || typeof text !== 'string') return '';

  const upperText = text.toUpperCase();

  // Check if it's GSTIN or a known acronym
  if (knownAcronyms.includes(upperText)) {
    return upperText;
  }

  const normalized = text.trim().toLowerCase();
  if (normalized === 'epic_number') return 'EPIC Number';

  return text
    .replace(/_/g, ' ') // Replace underscores with spaces
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}
const formattedDateTime = (datetime) =>
  datetime.toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // For AM/PM format
    timeZone: "Asia/Kolkata", // Indian Standard Time
  });
