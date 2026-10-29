const invoice = require("./../entities/invoices");
const { Op, Sequelize, literal } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");
const SubCorporateUser = require('../entities/subCorporateUsers');

exports.createInvoice = asyncHandler(async (params) => {
  const invoiceData = await invoice.create(params);
  return invoiceData;
});

exports.updateInvoice = asyncHandler(async (params, data) => {
  // Owner scope (F-OAB-08): honour credentialId when the caller supplies it (user-facing);
  // server-side callers (payment webhook) pass none and update by id only.
  const where = { id: params.id };
  if (params.credentialId) where.credentialId = params.credentialId;
  if (params.subCorporateUserId) where.subCorporateUserId = params.subCorporateUserId;
  return await invoice.update(data, { where });
});

exports.findOneInvoice = asyncHandler(async (params) => {
  // Owner scope (F-OAB-08): see updateInvoice above.
  const where = { id: params.id };
  if (params.credentialId) where.credentialId = params.credentialId;
  if (params.subCorporateUserId) where.subCorporateUserId = params.subCorporateUserId;
  return await invoice.findOne({ where, raw: true, nest: true });
});

exports.getInvoiceCount = asyncHandler(async (credentialId, subCorporateUserId) => {
  let whereClause = {
      credentialId
  }
  if(subCorporateUserId){
      whereClause.subCorporateUserId = subCorporateUserId;
  }
  return await invoice.count({ where: whereClause });
});

exports.getInvoiceCountByStatus = asyncHandler(async (status, credentialId, subCorporateUserId) => {
  let whereClause = {
      credentialId,
      status
  }

  if(subCorporateUserId){
      whereClause.subCorporateUserId = subCorporateUserId;
  }
  return await invoice.count({ where: whereClause });
});

exports.getInvoiceAmountByStatus = asyncHandler(async (status, credentialId,subCorporateUserId) => {
  let whereClause = {
      credentialId,
      status
  }

  if(subCorporateUserId){
      whereClause.subCorporateUserId = subCorporateUserId;
  }
  const result = await invoice.findAll({
      attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount']],
      where: whereClause
  });
  return result.length > 0 ? result[0].dataValues.totalAmount : 0;
});

/////////////////will find particular user's invoice////////////////////
exports.findAllInvoicesAndCount = asyncHandler(async (params) => {
  let { from, to, limit, offset, searchText, sort, userId, subCorporateUserId } = params;
  // Adjust 'to' date to end of day
  const tomorrow = new Date(to);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  let whereClause = {
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        recipientDetails: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        invoiceDetails: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        productDetails: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        paymentDetails: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        comments: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        termsConditions: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };

  if (userId) {
    whereClause.credentialId = userId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }
  

  if (from && to) {
    whereClause.createdAt = {
      [Op.between]: [from, tomorrow],
    };
  }

  return await invoice.findAndCountAll({
    include: [
      {
        model: SubCorporateUser,
        attributes: ['id', 'name'],
        required: false
      }
    ],
    where: whereClause,
    order: [["id", sort]],
    limit,
    offset,
    raw: true,
    nest: true,
  });
});

exports.findInvoiceByInvoiceId = asyncHandler( async(credentialId, invoiceNo, attributes = undefined) => {
  return await invoice.findOne({
      where: {
          [Op.and]: [{
              credentialId,
          },
              literal(`JSON_UNQUOTE(JSON_EXTRACT(\`invoiceDetails\`, '$.invoiceNo')) = :invoiceNo`)
          ]
      },
      attributes,
      replacements: { invoiceNo },
  })
})