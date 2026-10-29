const sequelizeConfig = require("./../../configs/database/index");
const asyncHandler = require("../../middlewares/async");
const invoiceGuideline = require("../entities/invoiceGuideline");
const invoicingV2 = require("../entities/invoicingV2");
const { Op } = require("sequelize");
const { customLog } = require("../../utils/loggerHelper");

exports.createBulk = asyncHandler(async (paramsArray) => {
  try {
    const responseDataArray = await invoiceGuideline.bulkCreate(paramsArray);
    return responseDataArray;
  } catch (error) {
    console.error("Error occurred while bulk creating:", error);
    return false;
  }
});

exports.update = asyncHandler(async (data, params) => {
  const responseData = await invoiceGuideline.update(data, {
    where: {
      id: params.id,
    },
  });
  if (!responseData) {
    return false;
  }
  return responseData;
});

exports.bulkUpdate = asyncHandler(async (paramsArray) => {
  try {
    await sequelizeConfig.transaction(async (transaction) => {
      for (const params of paramsArray) {
        await invoiceGuideline.upsert({ ...params }, { transaction });
      }
    });
    return true;
  } catch (err) {
    console.log(err.message);
    return false;
  }
});

exports.getAllGuidelines = asyncHandler(async (params) => {
  let whereClause = {};
  whereClause.invoiceId = params.invoiceId;
  const responseData = await invoiceGuideline.findAndCountAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: invoicingV2,
      },
    ],
    raw: true,
    nest: true,
  });
  if (!responseData) {
    return false;
  }
  return responseData;
});

exports.bulkDelete = asyncHandler(async (ids) => {
  const responseData = await invoiceGuideline.destroy({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
  });
  return responseData > 0;
});

exports.deleteGuideline = asyncHandler(async (id) => {
  const responseData = await invoiceGuideline.destroy({
    where: { id },
  });
  if (!responseData) {
    return false;
  }
  return true;
});

exports.findGuidelineById = async (id) => {
  try {
    return await invoiceGuideline.findOne({ where: { id }, raw: true });
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw new Error("Database error while fetching guideline");
  }
};

exports.completeRemindersByInvoice = async (invoiceId) => {
  try {
    return await invoiceGuideline.update(
      { status: "COMPLETED" },
      { where: { invoiceId, status: "PENDING" } }
    );
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw new Error("Database error while completing reminders");
  }
};

exports.getReminderDashboard = async ({
  corporateUserId,
  subCorporateUserId,
  status,
  searchText,
  sort,
  sortField,
  limit,
  offset,
  from,
  to,
}) => {
  try {
    const allowedSortFields = ["actionDate", "createdAt", "status"];
    const orderField = allowedSortFields.includes(sortField)
      ? sortField
      : "actionDate";
    const orderDir = sort || "DESC";

    const invoiceWhere = { corporateUserId, documentType: "INVOICE" };
    if (subCorporateUserId) invoiceWhere.subCorporateUserId = subCorporateUserId;

    const guidelineWhere = {};
    if (status) guidelineWhere.status = status;
    if (from && to) guidelineWhere.actionDate = { [Op.between]: [from, to] };
    else if (from) guidelineWhere.actionDate = { [Op.gte]: from };
    else if (to) guidelineWhere.actionDate = { [Op.lte]: to };

    const includeInvoice = {
      model: invoicingV2,
      where: invoiceWhere,
      attributes: [
        "id",
        "invoiceNumber",
        "prefix",
        "dueDate",
        "totalAmount",
        "amountDue",
        "status",
        "documentType",
        "name",
        "email",
        "currency",
      ],
      required: true,
    };

    if (searchText) {
      includeInvoice.where = {
        ...invoiceWhere,
        [Op.or]: [
          { invoiceNumber: { [Op.like]: `%${searchText}%` } },
          { name: { [Op.like]: `%${searchText}%` } },
          { email: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    const countOpts = (s) => ({
      include: [{ model: invoicingV2, where: { corporateUserId, documentType: "INVOICE" }, required: true }],
      where: { status: s },
    });

    const [rows, pending, completed, cancelled] = await Promise.all([
      invoiceGuideline.findAndCountAll({
        where: guidelineWhere,
        include: [includeInvoice],
        order: [[orderField, orderDir]],
        limit,
        offset,
        raw: true,
        nest: true,
      }),
      invoiceGuideline.count(countOpts("PENDING")),
      invoiceGuideline.count(countOpts("COMPLETED")),
      invoiceGuideline.count(countOpts("CANCELLED")),
    ]);

    return {
      rows: rows.rows,
      recordsTotal: rows.count,
      stats: { pending, completed, cancelled },
    };
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw new Error("Database error while fetching reminder dashboard");
  }
};
