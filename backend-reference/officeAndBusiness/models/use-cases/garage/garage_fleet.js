const { handleSortFields } = require("../../../utils/sortHandle");
const { Op } = require("sequelize");
const { garage_fleet: GarageFleet, garage_assignment, garage_driver } = require("../../entities/garage");
const sequelize = require("../../../configs/database/index");
const garage_operations_log = require("../../entities/garage/garage_operations_log");
const { createLog } = require("./garage_logs");
const moment = require("moment");
// const { formattedDateTime } = require("../../../utils/formatter");
const { customLog } = require("../../../utils/loggerHelper");
const { safeParseDate } = require("../../../utils/dateUtils");

exports.createFleet = async (data, credentialId, logTraceId = null) => {
  data.credentialId = credentialId;
  let transaction = await sequelize.transaction();
  try {
    //checking fleet already exist
    const existingFleet = await GarageFleet.findOne({
      where: {
        [Op.or]: [
          {
            vehicleNumber: data.vehicleNumber,
            credentialId,
          },
        ],
      },
    });

    if (existingFleet) {
      return {
        success: false,
        error: "This vehicle is already added to your fleet.",
      };
    }

    const responseData = await GarageFleet.create(data, {
      transaction: transaction,
    });
    if (!responseData) {
      return { success: false, error: "Failed to create fleet." };
    }

    await garage_operations_log.create(
      {
        actionType: "ADD_VEHICLE",
        referenceId: data.verification_id,
        description: `Vehicle added to the fleet with vehicle number: ${data.vehicleNumber}`,
        meta:{vehicleNumber:data.vehicleNumber},
        credentialId,
      },
      {
        transaction: transaction,
      }
    );
    await transaction.commit();
    return { success: true, data: responseData };
  } catch (error) {
    await transaction.rollback();
    customLog(logTraceId, "error", { message: "createFleet failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, error: "Something went wrong. If the issue persists, please contact support at reach@peko.one" };
  }
};

exports.getAllFleets = async (params) => {
  const { page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId } = params;
  try {
    let order = handleSortFields(sortField, sort);
    const offset = (page - 1) * itemsPerPage;

    let whereClause = { isDeleted: false };
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { vehicleNumber: { [Op.like]: `%${searchText}%` } },
          { manufacturer: { [Op.like]: `%${searchText}%` } },
          { engineNumber: { [Op.like]: `%${searchText}%` } },
          { chassisNumber: { [Op.like]: `%${searchText}%` } },
          { ownerName: { [Op.like]: `%${searchText}%` } },
          { regDate: { [Op.like]: `%${searchText}%` } },
          { regAuthority: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    return await GarageFleet.findAndCountAll({
      limit: itemsPerPage,
      include: [
        {
          model: garage_assignment,
          as: "assignments",
          where: { assignmentType: "Assigned" },
          required: false, // so it includes fleets even if no driver assigned
          include: [
            {
              model: garage_driver,
              as: "driver",
              attributes: ["id", "name", "dlNumber"], // Add more fields if needed
            },
          ],
        },
      ],
      offset: offset,
      order: order,
      where: whereClause,
    });
  } catch (error) {
    console.error("Get All Fleets Error:", error);
    return false;
  }
};

exports.getFleetById = async (id) => {
  try {
    const fleet = await GarageFleet.findOne({ where: { id, isDeleted: false } });

    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    return { success: true, data: fleet };
  } catch (error) {
    console.error("Get Fleet By ID Error:", error);
    return { success: false, message: "Unable to fetch fleet", error };
  }
};

exports.findOneFleet = async (params, logTraceId = null) => {
  try {
    params.isDeleted = false;
    const fleet = await GarageFleet.findOne({ where: params });

    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    return { success: true, data: fleet };
  } catch (error) {
    customLog(logTraceId, "error", { error: error, message: "Get Fleet By ID Error:" });
    console.error("Get Fleet By ID Error:", error);
    return { success: false, message: "Unable to fetch fleet", error };
  }
};

exports.updateFleetServiceDates = async (id, data, credentialId, logTraceId = null) => {
  try {
    const fleet = await GarageFleet.findOne({
      where: { id, credentialId, isDeleted: false },
    });
    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    const updatePayload = {};
    if (data.lastServiceDate !== undefined) {
      updatePayload.lastServiceDate = safeParseDate(data.lastServiceDate, logTraceId);
    }
    if (data.nextServiceDue !== undefined) {
      updatePayload.nextServiceDue = safeParseDate(data.nextServiceDue, logTraceId);
    }

    await fleet.update(updatePayload);

    const fmt = d => (d ? new Date(d).toISOString().split("T")[0] : "not set");
    const parts = [];
    if ("lastServiceDate" in updatePayload) parts.push(`last service ${fmt(updatePayload.lastServiceDate)}`);
    if ("nextServiceDue" in updatePayload) parts.push(`next service due ${fmt(updatePayload.nextServiceDue)}`);
    await createLog({
      actionType: "UPDATE_SERVICE_DATES",
      referenceId: String(id),
      description: `Service dates updated for vehicle ${fleet.vehicleNumber}: ${parts.join(", ")}`,
      meta: { vehicleNumber: fleet.vehicleNumber },
      credentialId,
    });

    return { success: true, data: fleet };
  } catch (error) {
    console.error("Update Fleet Service Dates Error:", error);
    return { success: false, message: "Unable to update service dates", error };
  }
};

exports.updateFleetFastag = async (id, data, credentialId) => {
  try {
    const fleet = await GarageFleet.findOne({
      where: { id, credentialId, isDeleted: false },
    });
    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    const updatePayload = {};
    if (data.fastagProvider !== undefined) {
      updatePayload.fastagProvider = data.fastagProvider || null;
    }
    if (data.fastagBillerId !== undefined) {
      updatePayload.fastagBillerId = data.fastagBillerId || null;
    }
    if (data.fastagRegistration !== undefined) {
      updatePayload.fastagRegistration = data.fastagRegistration || null;
    }
    if (data.fastagParamName !== undefined) {
      updatePayload.fastagParamName = data.fastagParamName || null;
    }

    await fleet.update(updatePayload);

    await createLog({
      actionType: "UPDATE_FASTAG",
      referenceId: String(id),
      description: fleet.fastagProvider
        ? `FASTag details updated for vehicle ${fleet.vehicleNumber}: provider ${fleet.fastagProvider}, registration ${fleet.fastagRegistration || "-"}`
        : `FASTag details removed for vehicle ${fleet.vehicleNumber}`,
      meta: { vehicleNumber: fleet.vehicleNumber },
      credentialId,
    });

    return { success: true, data: fleet };
  } catch (error) {
    console.error("Update Fleet Fastag Error:", error);
    return { success: false, message: "Unable to update FASTag details", error };
  }
};

// Ticket 31321: a per-vehicle refresh re-pulls the RC from the paid vendor API, so it is capped at
// once a week per vehicle. REFRESH_COOLDOWN_DAYS is the single source of truth for that window —
// the controller reads it back to build the "Next refresh available on ..." response.
const REFRESH_COOLDOWN_DAYS = 7;

const nextRefreshDate = (lastRefreshedAt) =>
  lastRefreshedAt ? moment(lastRefreshedAt).add(REFRESH_COOLDOWN_DAYS, "days").toDate() : null;
exports.nextRefreshDate = nextRefreshDate;

// Reserves the weekly refresh slot BEFORE the vendor is called. The stamp is written by a conditional
// UPDATE, so two clicks racing each other can only ever produce one paid call — the loser gets 0 rows
// back and is told when the next one is due. Callers must revert the claim if the vendor call fails.
exports.claimFleetRefresh = async (id, credentialId, logTraceId = null) => {
  try {
    const fleet = await GarageFleet.findOne({ where: { id, credentialId, isDeleted: false } });
    if (!fleet) {
      return { success: false, notFound: true, message: "Fleet not found" };
    }

    const now = new Date();
    const cutoff = moment(now).subtract(REFRESH_COOLDOWN_DAYS, "days").toDate();

    const [affected] = await GarageFleet.update(
      { lastRefreshedAt: now },
      {
        where: {
          id,
          credentialId,
          isDeleted: false,
          [Op.or]: [{ lastRefreshedAt: null }, { lastRefreshedAt: { [Op.lte]: cutoff } }],
        },
      }
    );

    if (!affected) {
      // Still inside the window (or a concurrent click won the race) — re-read so the date we quote
      // is the one actually stored, not the one this request saw a moment ago.
      const current = await GarageFleet.findOne({ where: { id, credentialId, isDeleted: false } });
      return {
        success: false,
        cooldown: true,
        lastRefreshedAt: current?.lastRefreshedAt ?? fleet.lastRefreshedAt,
        nextRefreshOn: nextRefreshDate(current?.lastRefreshedAt ?? fleet.lastRefreshedAt),
      };
    }

    return {
      success: true,
      data: fleet,
      previousLastRefreshedAt: fleet.lastRefreshedAt ?? null,
      claimedAt: now,
    };
  } catch (error) {
    customLog(logTraceId, "error", { message: "claimFleetRefresh failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, message: "Unable to refresh this vehicle" };
  }
};

// Puts the claim back the way it was so a vendor failure does not cost the user a week.
exports.revertFleetRefreshClaim = async (id, credentialId, previousLastRefreshedAt, logTraceId = null) => {
  try {
    await GarageFleet.update(
      { lastRefreshedAt: previousLastRefreshedAt ?? null },
      { where: { id, credentialId } }
    );
  } catch (error) {
    customLog(logTraceId, "error", { message: "revertFleetRefreshClaim failed", error: error?.message ?? String(error), stack: error?.stack });
  }
};

// Vendor-owned RC fields only. vehicleNumber is the row's identity and fasttagBalance/service dates/
// FASTag config are ours, so a refresh must not overwrite them.
const REFRESHABLE_FLEET_FIELDS = [
  "manufacturer",
  "model",
  "fuelType",
  "rcStatus",
  "insuranceValidUpto",
  "pucValidUpto",
  "permitValidUpto",
  "blacklistStatus",
  "engineNumber",
  "chassisNumber",
  "regDate",
  "regAuthority",
  "presentAddress",
  "permanentAddress",
  "manufacturingDate",
  "insuranceCompany",
  "policyNumber",
  "ownerName",
  "isCommercial",
  "insuranceExpiry",
  "rawData",
];

exports.applyFleetRefresh = async (id, credentialId, mapped, logTraceId = null) => {
  try {
    const fleet = await GarageFleet.findOne({ where: { id, credentialId, isDeleted: false } });
    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    const updatePayload = {};
    REFRESHABLE_FLEET_FIELDS.forEach((field) => {
      if (mapped[field] !== undefined) updatePayload[field] = mapped[field];
    });

    await fleet.update(updatePayload);

    return { success: true, data: fleet };
  } catch (error) {
    customLog(logTraceId, "error", { message: "applyFleetRefresh failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, message: "Unable to save the refreshed vehicle details" };
  }
};

exports.deleteFleetById = async (id, credentialId) => {
  try {
    const fleet = await GarageFleet.findOne({ where: { id, credentialId } });
    if (!fleet) {
      return { success: false, message: "Fleet not found" };
    }

    const existingAssignment = await garage_assignment.findOne({
      where: {
        vehicleId: id,
        assignmentType: {
          [Op.in]: ["Assigned", "Reassigned"],
        },
      },
    });

    if (existingAssignment) {
      return { success: false, message: "Fleet is assigned to a driver and cannot be deleted" };
    }

    // fleet.isDeleted = true;
    await fleet.destroy();
    await createLog({
      actionType: "DELETE_VEHICLE",
      meta: { vehicleNumber: fleet.vehicleNumber },
      referenceId: id,
      description: `Vehicle deleted with vehicle number: ${fleet.vehicleNumber}`,
      credentialId,
    });
    return { success: true, message: "Fleet deleted successfully" };
  } catch (error) {
    console.error("Delete Fleet Error:", error);
    return { success: false, message: "Unable to delete fleet", error };
  }
};

exports.getFleetVerificationStatusCount = async (params) => {
  const { credentialId, subCorporateUserId } = params;
  try {
    let whereClause = { isDeleted: false };

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const [verifiedCount, unverifiedCount, fleets] = await Promise.all([
      GarageFleet.count({
        where: {
          ...whereClause,
        },
      }),
      0,
      GarageFleet.findAll({
        where: {
          ...whereClause,
        },
        attributes: ["manufacturingDate", "regDate"],
      }),
    ]);

    const ageDistribution = {
      "0-3 years": 0,
      "3-5 years": 0,
      "5-10 years": 0,
      "10-15 years": 0,
      "15-20 years": 0,
      "20+ years": 0,
    };

    fleets.forEach((fleet) => {
      const manufacturingDate = fleet.manufacturingDate || fleet.regDate;
      const dateOfManufacture = moment(manufacturingDate, ["MM/YYYY", "YYYY-MM-DD"]);

      if (!dateOfManufacture.isValid()) {
        console.warn(`Invalid manufacturing date for fleet: ${fleet.id}`);
        return;
      }
      const age = moment().diff(dateOfManufacture, "years");

      if (age >= 0 && age <= 3) {
        ageDistribution["0-3 years"]++;
      } else if (age > 3 && age <= 5) {
        ageDistribution["3-5 years"]++;
      } else if (age > 5 && age <= 10) {
        ageDistribution["5-10 years"]++;
      } else if (age > 10 && age <= 15) {
        ageDistribution["10-15 years"]++;
      } else if (age > 15 && age <= 20) {
        ageDistribution["15-20 years"]++;
      } else if (age > 20) {
        ageDistribution["20+ years"]++;
      }
    });

    const ageDistributionData = Object.keys(ageDistribution).map((label) => ({
      label: label,
      value: ageDistribution[label],
    }));

    return {
      success: true,
      data: {
        verified: verifiedCount,
        unverified: unverifiedCount,
        ageDistributionData,
      },
    };
  } catch (error) {
    console.error("Get Fleet Verification Status Count Error:", error);
    return {
      success: false,
      data: {
        verified: 0,
        unverified: 0,
        ageDistributionData: [],
      },
      message: "Unable to fetch verification counts",
      error,
    };
  }
};

exports.getExcelCSVData = async (params) => {
  let { from, to, sort, sortField, credentialId } = params;

  const searchText = (params.searchText || "").trim();

  let whereClause = { credentialId };

  if (searchText) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${searchText}%` } },
      { vehicleNumber: { [Op.like]: `%${searchText}%` } },
      { manufacturer: { [Op.like]: `%${searchText}%` } },
      { model: { [Op.like]: `%${searchText}%` } },
      { engineNumber: { [Op.like]: `%${searchText}%` } },
    ];
  }

  if (from && to) {
    let tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, tomorrow],
    };
  }

  let sortClause;
  if (sort) {
    sortClause = [sortField, sort];
  } else {
    sortClause = [sortField, "ASC"];
  }

  const data = await GarageFleet.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: garage_assignment,
        as: "assignments",
        where: { assignmentType: "Assigned" },
        required: false, // so it includes fleets even if no driver assigned
        include: [
          {
            model: garage_driver,
            as: "driver",
            attributes: ["id", "name", "dlNumber"], // Add more fields if needed
          },
        ],
      },
    ],
    order: [sortClause],
    raw: true,
    nest: true,
  });

  let finalData = [];
  data.rows.forEach(function (limitData) {
    const dateStr = limitData.pucValidUpto;
    let statusText;
    const todays = new Date();
    const expiryDate = new Date(dateStr);
    const diffTime = expiryDate.getTime() - todays.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      statusText = "Expired";
    } else if (diffDays <= 15) {
      statusText = "Expires Soon";
    } else {
      statusText = expiryDate.toLocaleDateString("en-IN");
    }

let insuranceStatus = "N/A";
  if (limitData.insuranceExpiry) {
    const expiry = new Date(limitData.insuranceExpiry);

    if (isNaN(expiry.getTime())) {
      insuranceStatus = "Invalid Date";
    } else {
      const diffTime = expiry.getTime() - todays.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        insuranceStatus = "Expired";
      } else if (diffDays <= 10) {
        insuranceStatus = "Expiring Soon";
      } else {
        insuranceStatus = "Active";
      }
    }
  }



    finalData.push({
      Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
      "Vehicle No": limitData.vehicleNumber ? limitData.vehicleNumber : "Not Available",
      // Manufacturer: limitData.manufacturer ? limitData.manufacturer : "Not Available",
      "Make & Model": limitData.model ? limitData.model : "Not Available",
      // "Engine No": limitData.engineNumber ? limitData.engineNumber : "Not Available",
      "Fuel Type": limitData.fuelType ? limitData.fuelType : "Not Available",
      // "RC Status": limitData.rcStatus ? limitData.rcStatus : "Not Available",
       Insurance: insuranceStatus,
      PUC: statusText ? statusText : "Not Available",
      "Driver Assigned": limitData?.assignments?.driver?.name ?? "Not Available",
    });
  });
  return finalData;
};

exports.getServiceDueCount = async ({ credentialId, subCorporateUserId }) => {
  try {
    const next15Days = new Date();
    next15Days.setDate(next15Days.getDate() + 15);

    let whereClause = {
      isDeleted: false,
      nextServiceDue: { [Op.ne]: null, [Op.lte]: next15Days },
    };
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const dueVehicles = await GarageFleet.findAll({
      where: whereClause,
      attributes: ["id"],
    });
    const count = dueVehicles.length;
    // When exactly one vehicle is due, expose its id so the "Review" action can
    // deep-link straight to that vehicle's details page.
    const vehicleId = count === 1 ? dueVehicles[0].id : null;
    return { success: true, data: count, vehicleId };
  } catch (error) {
    console.error("Get Service Due Count Error:", error);
    return { success: false, data: 0, vehicleId: null };
  }
};

exports.getGarageFleetUsage = async (credentialId) => {
  try {
    const count = await GarageFleet.count({
      where: {
        credentialId,
        isDeleted: false,
      },
    });
    return { success: true, data: count };
  } catch (error) {
    console.error("getGarageFleetUsage error:", error);
    return { success: false, message: "Failed to fetch fleet usage", error };
  }
};

exports.findFleetNumbersByCredential = async ({ credentialId, subCorporateUserId }) => {
  try {
    const whereClause = {
      isDeleted: false,
    };

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
    } else {
      whereClause.credentialId = credentialId;
    }

    const fleets = await GarageFleet.findAll({
      where: whereClause,
      attributes: ["vehicleNumber"],
      raw: true,
    });

    return fleets
      .map((fleet) => (fleet.vehicleNumber || "").trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.error("findFleetNumbersByCredential error:", error);
    return [];
  }
};

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
