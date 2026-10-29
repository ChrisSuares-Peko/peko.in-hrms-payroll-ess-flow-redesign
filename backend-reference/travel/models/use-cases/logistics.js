const { QueryTypes } = require("sequelize");
const { customLog } = require("../../utils/loggerHelper");
const shipmentOrder = require("../entities/shipmentOrders");
let sequelizeConfig = require("../../configs/database/index");
const { Op } = require('sequelize');
const credential = require("../entities/credential");


const createShipmentOrder = async (params) => {
  try {
    return await shipmentOrder.create(params);
  } catch (error) {
    customLog(null, 'error', { message: "Logistics order creation failed", data: error })
    return false
  }
};

const updateOrderByCorporateTxnId = async (corporateTxnId, updateObj) => {
  try {
    const [updatedCount] = await shipmentOrder.update(
      updateObj,
      { where: { corporateTxnId } }
    );

    if (updatedCount === 0) {
      customLog(null, 'error', {
        message: "Logistics order udpate failed since no record was found",
        data: { corporateTxnId, updateObj }
      })
      return false;
    }
    return updatedCount;
  } catch (error) {
    customLog(null, 'error', { message: "Logistics order udpate failed", data: error })
    return false
  }
};

const updateStatusAndTracking = async (corporateTxnId, newStatusObj, webhookData) => {
  try {
    const record = await shipmentOrder.findOne({
      where: { corporateTxnId },
      include: [
        {
          model: credential,
          attributes: ["id", "registeredBy","email"],
        },
      ]
    });
    if (!record) return { status: false, reason: 'NOT_FOUND' };
    // Always treat trackingDetails as an array
    const existingTracking = Array.isArray(record.trackingDetails)
      ? [...record.trackingDetails]
      : [];

    // Dedup key is vendorStatus + timestamp, not vendorStatus alone — a shipment can
    // legitimately revisit the same status (e.g. "Out For Pickup" after a pickup
    // exception retry) and each occurrence needs its own timeline entry. Matching on
    // vendorStatus alone only guards against Shiprocket redelivering the same webhook.
    const vendorStatusKey = newStatusObj.vendorStatus && String(newStatusObj.vendorStatus).trim();
    const timestampKey = newStatusObj.timestamp && String(newStatusObj.timestamp).trim();
    if (vendorStatusKey) {
      const matchedIndex = existingTracking.findIndex(
        (t) =>
          t &&
          String(t.vendorStatus).trim() === vendorStatusKey &&
          String(t.timestamp).trim() === timestampKey
      );
      if (matchedIndex !== -1) {
        // Same status + same timestamp => duplicate webhook delivery, merge in place
        existingTracking[matchedIndex] = {
          ...existingTracking[matchedIndex],
          ...newStatusObj,
        };
      } else {
        // New status, or the same status recurring at a new timestamp => push
        existingTracking.push(newStatusObj);
      }
    } else {
      // vendorStatus not provided => always push
      existingTracking.push(newStatusObj);
    }

    // Update record directly without redundant where clause (record already fetched)
    await record.update({
      status: webhookData.status,
      trackingUrl: webhookData.trackingUrl,
      trackingNo: webhookData.trackingNumber,
      vendorOrderId: webhookData.vendorId || webhookData.otoId || null,
      trackingDetails: existingTracking,
    });

    return {
      status: true,
      data: record,
    };
  } catch (error) {
    customLog(null, 'error', { message: "Logistics webhook udpate failed", data: error })
    return {
      status:false
    }
  }
};

const findShipmentById = async (trackingNumber, credentialId) => {
  try {
    const whereClause = { credentialId };

    if (trackingNumber) {
      whereClause[Op.or] = [
        { trackingNo: trackingNumber },
        { corporateTxnId: trackingNumber }
      ];
    }

    const record = await shipmentOrder.findOne({
      where: whereClause,
      raw: true,
      nest: true,
      attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'credentialId'] }
    });

    if (!record) {
      customLog(null, 'error', { message: "No logistics record found", data: `No record found with corporateTxnId: ${trackingNumber} and credentialId: ${credentialId}` })
      return null;
    }

    return record;
  } catch (error) {
    customLog(null, 'error', { message: "Logistics order details fetch failed", data: error })
  }
};



const fetchOrderHistory = async (params) => {
  const {
    from,
    to,
    itemsPerPage,
    page,
    credentialId,
    searchText,
  } = params;
  let transformedSearch = searchText;

  if (searchText?.toLowerCase() === 'domestic') {
    transformedSearch = 'DOM';
  } else if (searchText?.toLowerCase() === 'international') {
    transformedSearch = 'EXP';
  }

  const replacements = {
    credentialId,
    searchText: `%${transformedSearch}%`,
    from: from || null,
    to: to || null,
    toTomorrow: to ? new Date(new Date(to).setDate(new Date(to).getDate() + 1)).toISOString().split('T')[0] + ' 00:00:00' : null,
    limit: parseInt(itemsPerPage, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10)
  };

  const whereCaluse = `
        WHERE 
            so.credentialId = :credentialId
            AND (
                so.trackingNo LIKE :searchText
                OR so.corporateTxnId LIKE :searchText
                OR so.shipmentType LIKE :searchText
                OR CAST(so.amount AS CHAR) LIKE :searchText
                OR so.status LIKE :searchText
            )
            -- Optional date filter
            AND (:from IS NULL OR :to IS NULL OR so.createdAt BETWEEN :from AND :toTomorrow)
    `
  const rowQuery = `
        SELECT 
            so.corporateTxnId, 
            so.createdAt AS date, 
            so.id, 
            so.shipmentType, 
            so.status, 
            so.trackingNo AS trackingNumber, 
            o.status AS paymentStatus,
            o.amountInINR AS amount
        FROM 
            shipmentOrders so
        LEFT JOIN 
            orders o ON so.corporateTxnId = o.corporateTxnId COLLATE utf8mb4_general_ci
        ${whereCaluse}
        ORDER BY 
            so.createdAt DESC
        LIMIT :limit OFFSET :offset;
    `

  const countRowQuery = `
        SELECT 
            COUNT(*) AS count
        FROM 
            shipmentOrders so
        ${whereCaluse};
    `



  const result = await sequelizeConfig.query(rowQuery, { replacements, type: QueryTypes.SELECT });
  const [countResult] = await sequelizeConfig.query(countRowQuery, { replacements, type: QueryTypes.SELECT });

  return {
    rows: result,
    count: countResult.count
  };
}

const updateShipmentEntry = async (corporateTxnId, data, status) => {

  return await shipmentOrder.update(
    {
      returnDetails: data,
      status
    },
    { where: { corporateTxnId } }
  );
}

const findPanByCredentialId = async (credentialId) => {
  try {
    return await shipmentOrder.findOne({
      where: { credentialId, businessPanUrl: { [Op.ne]: null } },
      attributes: ['businessPanUrl'],
      raw: true,
    });
  } catch (error) {
    customLog(null, 'error', { message: 'Failed to check business PAN', data: error });
    return null;
  }
};

const fetchAllLogisticsCorporates = async ({ searchText, page, itemsPerPage }) => {
  const replacements = {
    searchText: `%${searchText || ''}%`,
    limit: parseInt(itemsPerPage, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10),
  };

  const whereClause = `WHERE (c.name LIKE :searchText OR c.email LIKE :searchText OR c.username LIKE :searchText OR cu.companyName LIKE :searchText)`;

  const rowQuery = `
    SELECT
      c.id AS credentialId,
      c.name,
      c.email,
      c.username,
      cu.companyName,
      cu.contactPersonName,
      (
        SELECT so2.businessPanUrl
        FROM shipmentOrders so2
        WHERE so2.credentialId = c.id AND so2.businessPanUrl IS NOT NULL
        ORDER BY so2.updatedAt DESC
        LIMIT 1
      ) AS businessPanUrl,
      (
        SELECT so2.updatedAt
        FROM shipmentOrders so2
        WHERE so2.credentialId = c.id AND so2.businessPanUrl IS NOT NULL
        ORDER BY so2.updatedAt DESC
        LIMIT 1
      ) AS panUploadedAt
    FROM credentials c
    INNER JOIN (SELECT DISTINCT credentialId FROM shipmentOrders) sub ON sub.credentialId = c.id
    LEFT JOIN corporateUsers cu ON cu.credentialId = c.id
    ${whereClause}
    ORDER BY panUploadedAt IS NULL ASC, panUploadedAt DESC
    LIMIT :limit OFFSET :offset
  `;

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM credentials c
    INNER JOIN (SELECT DISTINCT credentialId FROM shipmentOrders) sub ON sub.credentialId = c.id
    LEFT JOIN corporateUsers cu ON cu.credentialId = c.id
    ${whereClause}
  `;

  const rows = await sequelizeConfig.query(rowQuery, { replacements, type: QueryTypes.SELECT });
  const [countResult] = await sequelizeConfig.query(countQuery, { replacements, type: QueryTypes.SELECT });

  return { rows, count: countResult.count };
};

module.exports = {
  createShipmentOrder,
  updateOrderByCorporateTxnId,
  updateStatusAndTracking,
  findShipmentById,
  fetchOrderHistory,
  updateShipmentEntry,
  findPanByCredentialId,
  fetchAllLogisticsCorporates,
};

