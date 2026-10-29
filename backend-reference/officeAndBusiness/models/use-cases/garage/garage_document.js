"use strict";
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../utils/sortHandle");
const { garage_fleet, garage_driver, garage_document: GarageDocument } = require("../../entities/garage");
const { uploadFile } = require("../../../utils/commonUploadFile");
const { safeParseDate } = require("../../../utils/dateUtils");
const { customLog } = require("../../../utils/loggerHelper");
  
// uploadFile measures the base64 string, which is 4/3 of the decoded file — 7 "MB" of base64 ≈ 5 MB file.
const MAX_DOCUMENT_UPLOAD_BASE64_MB = Math.ceil((5 * 4) / 3);
const { createLog } = require("./garage_logs");

// Operations Log helper — resolves the vehicle/driver the document belongs to. Never throws.
const logDocumentAction = async (actionType, doc, credentialId, logTraceId = null) => {
  try {
    let target = "";
    let meta;
    if (doc.vehicleId) {
      const fleet = await garage_fleet.findByPk(doc.vehicleId, { attributes: ["vehicleNumber"] });
      if (fleet?.vehicleNumber) {
        target = ` for vehicle ${fleet.vehicleNumber}`;
        meta = { vehicleNumber: fleet.vehicleNumber };
      }
    } else if (doc.driverId) {
      const driver = await garage_driver.findByPk(doc.driverId, { attributes: ["dlNumber"] });
      if (driver?.dlNumber) {
        target = ` for driver DL ${driver.dlNumber}`;
        meta = { dlNumber: driver.dlNumber };
      }
    }
    const verb = { UPLOAD_DOCUMENT: "uploaded", UPDATE_DOCUMENT: "updated", DELETE_DOCUMENT: "deleted" }[actionType];
    await createLog({
      actionType,
      referenceId: String(doc.id),
      description: `${doc.type || "Document"} document ${verb}${target}`,
      ...(meta && { meta }),
      credentialId,
    });
  } catch (error) {
    customLog(logTraceId, "error", { message: "document operations log failed", error: error?.message ?? String(error) });
  }
};


exports.createDocument = async (data, user, logTraceId = null) => {
  try {
    if (data.expiryDate !== undefined) {
      data.expiryDate = safeParseDate(data.expiryDate, logTraceId);
    }
    //checking doc already exist (scoped to the vehicle when provided, so the same
    // type+expiry on a different vehicle isn't wrongly treated as a duplicate)
    const existingDocument = await GarageDocument.findOne({
      where: {
        type: data.type,
        expiryDate: data.expiryDate,
        credentialId: data.credentialId,
        ...(data.vehicleId ? { vehicleId: data.vehicleId } : {}),
      },
    });
  
    if (existingDocument) {
      return { success: false, error: "Document with this name already exists." };
    }
  
    let filePath;
    if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
      filePath = `corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
      data.subCorporateUserId = user?.subCorporateId
    } else {
      filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
    }
  
    if (
      Object.prototype.hasOwnProperty.call(data, "documentBase") &&
      data.documentFormat
    ) {
      const fileKey = await uploadFile(
        data.documentBase,
        filePath,
        data.documentFormat,
        MAX_DOCUMENT_UPLOAD_BASE64_MB,
      );
      data.fileUrl = fileKey;
    }
  
    const responseData = await GarageDocument.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create document." };
    }
    await logDocumentAction("UPLOAD_DOCUMENT", responseData, data.credentialId, logTraceId);
    return { success: true, data: responseData };
  } catch (error) {
    customLog(logTraceId, "error", { message: "createDocument failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, error: "Something went wrong. If the issue persists, please contact support at reach@peko.one" };
  
  }
};

exports.updateDocument = async (id, data, user, logTraceId = null) => {
  try {
    // Check if document exists
    const existing = await GarageDocument.findByPk(id);
    if (!existing) {
      return { success: false, error: "Document not found." };
    }

    // Owner gate: only the document's owner may update it (prevents ownership takeover).
    // Real documents always carry a credentialId; the existing.credentialId guard leaves
    // any legacy owner-less row updatable (there is no owner to take over).
    if (data.credentialId && existing.credentialId && String(existing.credentialId) !== String(data.credentialId)) {
      return { success: false, error: "Document not found." };
    }

    // Check for duplicates (excluding the current doc)
    // const duplicateDoc = await GarageDocument.findOne({
    //   where: {
    //     id: { [Op.ne]: id },
    //     type: data.type,
    //     expiryDate: data.expiryDate,
    //     credentialId: data.credentialId,
    //   },
    // });

    // if (duplicateDoc) {
    //   return { success: false, error: "Document with this name already exists." };
    // }

    // Construct filePath
    let filePath;
    if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
      filePath = `corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
      data.subCorporateUserId = user?.subCorporateId
    } else {
      filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
    }

    // If file is being updated
    if (data.documentBase && data.documentFormat) {
      const fileKey = await uploadFile(
        data.documentBase,
        filePath,
        data.documentFormat,
        MAX_DOCUMENT_UPLOAD_BASE64_MB
      );
      data.fileUrl = fileKey;
    }

    if (data.expiryDate !== undefined) {
      data.expiryDate = safeParseDate(data.expiryDate, logTraceId);
    }

    // Update document
    await existing.update(data);

    await logDocumentAction("UPDATE_DOCUMENT", existing, data.credentialId ?? existing.credentialId, logTraceId);
    return { success: true, data: existing };
  } catch (error) {
    customLog(logTraceId, "error", { message: "updateDocument failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, error: "Something went wrong. If the issue persists, please contact support at reach@peko.one" };
  }
};

exports.getAllDocuments = async ({page, itemsPerPage,searchText, sortField, sort,subCorporateUserId, vehicleId, driverId, type, credentialId}) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const order = handleSortFields(sortField, sort);

    let whereClause = {};
    if (vehicleId) whereClause.vehicleId = vehicleId;
    if (driverId) whereClause.driverId = driverId;
    if (type) whereClause.type = type;
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { vehicleId: { [Op.like]: `%${searchText}%` } },
          { driverId: { [Op.like]: `%${searchText}%` } },
          { type: { [Op.like]: `%${searchText}%` } },
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

    return await GarageDocument.findAndCountAll({
      limit: itemsPerPage,
      offset,
      order,
      where: whereClause,
    });
  } catch (error) {
    console.error("Get All Documents Error:", error);
    return { success: false, message: "Unable to fetch documents", error };
  }
};

exports.getDocumentById = async (id, credentialId = undefined) => {
  try {
    const doc = await GarageDocument.findByPk(id);
    // Owner gate: a document owned by another credentialId is reported as not found
    // (real documents always carry a credentialId).
    if (!doc || (credentialId && String(doc.credentialId) !== String(credentialId))) {
      return { success: false, message: "Document not found" };
    }

    return { success: true, data: doc };
  } catch (error) {
    console.error("Get Document By ID Error:", error);
    return { success: false, message: "Unable to fetch document", error };
  }
};

exports.deleteDocument = async (id, credentialId) => {
  try {
 const doc = await GarageDocument.findOne({
  where: { id, credentialId },
});

    if (!doc) {
      return { success: false, message: "Document not found" };
    }

    await doc.destroy({ force: true }); // use force if paranoid mode is enabled
    await logDocumentAction("DELETE_DOCUMENT", doc, credentialId);
    return { success: true, message: "Document permanently deleted" };
  } catch (error) {
    console.error("Delete Document Error:", error);
    return { success: false, message: "Unable to delete document", error };
  }
};


exports.getDocumentExpiryAlertsList = async (params) => {
  const { credentialId, subCorporateUserId } = params;

  try {
    let whereClause = {
      expiryDate: { [Op.ne]: null },
    };

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const documents = await GarageDocument.findAll({
      where: whereClause,
      attributes: ["id", "type", "expiryDate", "vehicleId", "driverId"],
      include: [
        {
          model: garage_fleet,
          as: "vehicle",
          attributes: ["vehicleNumber"],
          required: false,
        },
        {
          model: garage_driver,
          as: "driver",
          attributes: ["dlNumber"],
          required: false,
        },
      ],
    });

    const today = new Date();
    const result = [];

    // Expired or expiring within 30 days; null otherwise.
    const getExpiryStatus = (date) => {
      const diffDays = Math.ceil((new Date(date) - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return "Expired";
      if (diffDays <= 30) return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
      return null;
    };

    // Vehicles already covered by an uploaded document, per type.
    const coveredByDocument = new Set();

    documents.forEach(doc => {
      const status = getExpiryStatus(doc.expiryDate);
      if (doc.vehicleId) {
        coveredByDocument.add(`${doc.type?.toLowerCase()}::${doc.vehicleId}`);
      }
      if (!status) return;

      let vehicleOrDlNumber = "";

      if (doc.vehicle) {
        vehicleOrDlNumber = doc.vehicle.vehicleNumber;
      } else if (doc.driver) {
        vehicleOrDlNumber = doc.driver.dlNumber;
      }

      result.push({
        type: doc.type,
        vehicleOrDlNumber,
        status,
      });
    });

    // Fleet records carry insurance/PUC expiry from the RC data even when no
    // document was uploaded — alert on those too, skipping vehicles whose
    // uploaded document of the same type already covers them.
    let fleetWhere = { isDeleted: false };
    if (credentialId) {
      fleetWhere.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      fleetWhere.subCorporateUserId = subCorporateUserId;
      delete fleetWhere.credentialId;
    }

    const fleets = await garage_fleet.findAll({
      where: fleetWhere,
      attributes: ["id", "vehicleNumber", "insuranceExpiry", "pucValidUpto"],
    });

    fleets.forEach(fleet => {
      const fleetExpiries = [
        ["Insurance", fleet.insuranceExpiry],
        ["PUC", fleet.pucValidUpto],
      ];
      fleetExpiries.forEach(([type, date]) => {
        if (!date || coveredByDocument.has(`${type.toLowerCase()}::${fleet.id}`)) return;
        const status = getExpiryStatus(date);
        if (!status) return;
        result.push({
          type,
          vehicleOrDlNumber: fleet.vehicleNumber,
          status,
        });
      });
    });

    result.sort((a, b) => {
      if (a.status === "Expired" && b.status !== "Expired") return -1;
      if (a.status !== "Expired" && b.status === "Expired") return 1;

      const daysA = parseInt(a.status.match(/\d+/)) || 0;
      const daysB = parseInt(b.status.match(/\d+/)) || 0;
      return daysA - daysB;
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get Document Expiry Alerts List Error:", error);
    return { success: false, message: "Unable to fetch document expiry alerts", error };
  }
};