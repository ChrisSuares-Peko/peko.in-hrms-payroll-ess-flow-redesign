const paymentLinks = require("./../entities/paymentLink");
const Invoice = require("./../entities/invoices");
const { Op, fn, col, literal } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");
let sequelizeConfig = require("../../configs/database/index");
const invoiceSupplier = require("../entities/invoiceSuppliers");


exports.createPaymentLink = async (params) => {
  try {
    return await paymentLinks.create(params);
  } catch (error) {
    console.log(error.message);
    return false;
  } finally {
    console.log("PAYMENT LINKS CREATE ROUTE CALLED");
  }
};

exports.findOne = asyncHandler(async (params) => {
  return await paymentLinks.findOne({
    where: params,
  })
})

exports.findAllPaymentLinks = asyncHandler(async (params) => {
  try {


    let { limit, offset, sort, sortField, corporateId, searchText } = params;
    let whereClause = {
      [Op.or]: [
        {
          type: {
            [Op.ne]: 'ADMIN', // Exclude 'ADMIN'
          },
        },
        {
          type: {
            [Op.is]: null, // Include rows where type is NULL
          },
        }
      ],
      credentialId: corporateId,
    };

    if (searchText) {
      whereClause[Op.or] = [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          status: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          invoiceId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          amount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          [Op.and]: sequelizeConfig.where(
            sequelizeConfig.json('sentPayload.full_name'),
            { [Op.like]: `%${searchText}%` }
          ),
        }
      ];
    }

    const paymentLinksData = await paymentLinks.findAndCountAll({
      where: whereClause,
      order: [[sortField, sort]],
      limit: limit,
      offset: offset,
      raw: true,
      nest: true,
      attributes: { exclude: ['updates'] }
    });

    const clientUrls = paymentLinksData.rows.map((link) => link.paymentLink); // Step 1: Extract client URLs

    
    const invoices = await Invoice.findAll({
      where: {
        paymentLink: clientUrls, // Query where paymentLink matches any client URL
      },
      attributes: ['paymentLink', 'invoiceDetails'], // Fetch only necessary fields
      raw: true,
    });

    // Step 3: Create a mapping for quick lookup
    const invoiceMap = invoices.reduce((map, invoice) => {
      try {
        const parsedDetails = JSON.parse(invoice.invoiceDetails);
        map[invoice.paymentLink] = parsedDetails.invoiceNo; // Store the invoiceNo by paymentLink
      } catch (err) {
        console.error(`Error parsing invoiceDetails for paymentLink: ${invoice.paymentLink}`, err);
      }
      return map;
    }, {});

    // Step 4: Add invoiceNo to corresponding payment link objects
    paymentLinksData.rows.forEach((link) => {
      link.invoiceNo = invoiceMap[link.paymentLink] || null; // Add invoiceNo or default to null
    });

    return paymentLinksData
  } catch (error) {
    console.log(error);
    return false

  }
});

exports.update = asyncHandler(async (paymentLinkId, data, extraWhere = {}) => {
  try {
    return await paymentLinks.update(data, {
      where: {
        id: paymentLinkId,
        ...extraWhere,
      }
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("PAYOUT FIND ONE ROUTE CALLED");
  }
});

exports.totalStatistics = asyncHandler(async (corporateId) => {
  const result = await paymentLinks.findAll({
    attributes: [
      // Total payment request count
      [fn("COUNT", col("id")), "totalPaymentRequests"],

      // Total amount requested (sum of all amounts)
      [fn("SUM", col("amount")), "totalAmountRequested"],

      // Count of rows where status is 'paid'
      [fn("COUNT", literal(`CASE WHEN status = 'paid' THEN 1 END`)), "totalPaidRequests"],

      // Count of rows where status is 'created'
      [fn("COUNT", literal(`CASE WHEN status = 'pending' THEN 1 END`)), "totalPendingRequests"],

      // Sum of amounts where status is 'paid'
      [fn("SUM", literal(`CASE WHEN status = 'paid' THEN amount END`)), "totalPaidAmount"],

      // Sum of amounts where status is 'created'
      [fn("SUM", literal(`CASE WHEN status = 'pending' THEN amount END`)), "totalPendingAmount"],
    ],
    where: {
      credentialId: corporateId,
    },
    raw: true,
  });

  return result[0]; // Returns the first result
});


exports.updateKyb = asyncHandler(async (corporateUserId, businessType) => {
  try {
    return await invoiceSupplier.update(
      {
        kybStatus: 'IN PROGRESS',
        businessType,
      },
      {
        where: {
          corporateUserId,
        },
      }
    );
  } catch (error) {
    console.error('Error updating KYB status:', error);
    throw new Error('Failed to update KYB status');
  }
});







