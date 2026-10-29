const { Op } = require("sequelize");
const { handleSortFields } = require("../../../utils/sortHandle");
const {
  garage_quote_request: GarageQuoteRequest,
} = require("../../entities/garage");
const credential = require("../../entities/credential");
const SubCorporateUser = require("../../entities/subCorporateUsers");
const { customLog } = require("../../../utils/loggerHelper");
const { createLog } = require("./garage_logs");

exports.createQuoteRequest = async (data, credentialId, logTraceId = null) => {
  try {
    // Limit to one quote request per vehicle per day per account:
    // if a request already exists today for this vehicle, return it (no duplicate lead).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingWhere = {
      credentialId,
      isDeleted: false,
      createdAt: { [Op.gte]: startOfDay },
    };
    if (data.vehicleId) {
      existingWhere.vehicleId = data.vehicleId;
    } else if (data.vehicleNumber) {
      existingWhere.vehicleNumber = data.vehicleNumber;
    }

    const existing = await GarageQuoteRequest.findOne({ where: existingWhere });
    if (existing) {
      return { success: true, data: existing, duplicate: true };
    }

    const responseData = await GarageQuoteRequest.create({
      ...data,
      credentialId,
      status: "NEW",
    });
    if (!responseData) {
      return { success: false, error: "Failed to create quote request." };
    }
    await createLog({
      actionType: "REQUEST_QUOTE",
      referenceId: String(responseData.id),
      description: `${data.insuranceType || "Insurance"} quote requested${data.vehicleNumber ? ` for vehicle ${data.vehicleNumber}` : ""}`,
      ...(data.vehicleNumber && { meta: { vehicleNumber: data.vehicleNumber } }),
      credentialId,
    });
    return { success: true, data: responseData };
  } catch (error) {
    customLog(logTraceId, "error", { message: "createQuoteRequest failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, error: "Something went wrong. If the issue persists, please contact support at reach@peko.one" };
  }
};

exports.getAllQuoteRequests = async (params) => {
  const { page, itemsPerPage, sortField, sort, searchText, status, insuranceType, from, to } =
    params;
  try {
    const order = handleSortFields(sortField, sort);
    const offset = (page - 1) * itemsPerPage;

    const whereClause = { isDeleted: false };

    if (searchText) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${searchText}%` } },
        { mobileNumber: { [Op.like]: `%${searchText}%` } },
        { email: { [Op.like]: `%${searchText}%` } },
        { vehicleNumber: { [Op.like]: `%${searchText}%` } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (insuranceType) {
      whereClause.insuranceType = insuranceType;
    }
    if (from && to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = { [Op.between]: [from, endDate] };
    }

    return await GarageQuoteRequest.findAndCountAll({
      limit: itemsPerPage,
      offset,
      order,
      where: whereClause,
      include: [
        {
          model: credential,
          attributes: ["id", "name", "email", "username"],
          required: false,
        },
        {
          model: SubCorporateUser,
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    });
  } catch (error) {
    console.error("Get All Quote Requests Error:", error);
    return false;
  }
};

exports.updateQuoteRequestStatus = async (id, data) => {
  try {
    const quoteRequest = await GarageQuoteRequest.findOne({
      where: { id, isDeleted: false },
    });
    if (!quoteRequest) {
      return { success: false, message: "Quote request not found" };
    }

    const updatePayload = {};
    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }
    if (data.remarks !== undefined) {
      updatePayload.remarks = data.remarks;
    }

    await quoteRequest.update(updatePayload);

    return { success: true, data: quoteRequest };
  } catch (error) {
    console.error("Update Quote Request Status Error:", error);
    return { success: false, message: "Unable to update quote request", error };
  }
};

exports.getQuoteRequestExcelData = async (params) => {
  const { sortField, sort, searchText, status, insuranceType, from, to } = params;
  try {
    const order = handleSortFields(sortField, sort);
    const whereClause = { isDeleted: false };

    if (searchText) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${searchText}%` } },
        { mobileNumber: { [Op.like]: `%${searchText}%` } },
        { email: { [Op.like]: `%${searchText}%` } },
        { vehicleNumber: { [Op.like]: `%${searchText}%` } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (insuranceType) {
      whereClause.insuranceType = insuranceType;
    }
    if (from && to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = { [Op.between]: [from, endDate] };
    }

    const data = await GarageQuoteRequest.findAll({
      where: whereClause,
      order,
      include: [
        {
          model: credential,
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      raw: true,
      nest: true,
    });

    return data.map((row) => ({
      Date: row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "Not Available",
      "Corporate": row.credential?.name || "Not Available",
      "Full Name": row.fullName || "Not Available",
      "Mobile Number": row.mobileNumber || "Not Available",
      Email: row.email || "Not Available",
      "Insurance Type": row.insuranceType || "Not Available",
      "Vehicle No": row.vehicleNumber || "Not Available",
      Status: row.status || "Not Available",
      Remarks: row.remarks || "",
    }));
  } catch (error) {
    console.error("Get Quote Request Excel Data Error:", error);
    return [];
  }
};
