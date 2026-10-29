const asyncHandler = require("../../middlewares/async");
const {
  createCorporateDocument,
  findAllCorporateDocuments,
  delectDocfiles,
} = require("../../models/use-cases/corporateDocuments");
const moment = require('moment');
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../utils/s3");
const { NODE_ENV } = process.env;

const { ALL_DOCUMENT_NAMES, DOCUMENTS_BY_NAME, DEFAULT_MAX_SIZE_KB, MAX_TOTAL_UPLOAD_KB } = require("../../constants/kybDocuments");
const { getMaxSizeKbMap } = require("../../services/documentSizeLimits");

/** Never show a corporate a storage name like Signing_Authority_Aadhaar_Card. */
const documentLabel = (documentName) =>
  DOCUMENTS_BY_NAME[documentName]?.label || "That document";
const { canModifyKybDocuments } = require("../../constants/corporateCardApplication");
const { findByCorporate } = require("../../models/use-cases/corporateCardAdminApplication");

const documentNames = ALL_DOCUMENT_NAMES;
exports.documentNames = documentNames;


const sizeLabel = (kb) => (kb % 1024 === 0 ? `${kb / 1024} MB` : `${kb} KB`);

const getBase64SizeInBytes = (base64String) =>
  base64String ? Buffer.from(base64String, "base64").length : 0;

const discardStoredFiles = async (rows, req) => {
  for (const row of rows) {
    if (!row?.document) continue;
    try {
      await deleteEncryptedFromS3(row.document);
    } catch (error) {
      customLog(req?.LogTraceId, "error", {
        message: "Removed the document row but could not delete its stored file",
        data: { documentName: row.documentName, error: error?.message },
      });
    }
  }
};

exports.uploadOneKYBDocument = asyncHandler(async (req, res, next) => {
  try {
    const {
      corporateId: corporateUserId,
      username,
    } = req.user;
    const documents = Array.isArray(req.body?.documents) ? req.body.documents : [];
    const docNamelist = Array.isArray(req.body?.deleteDoclist) ? req.body.deleteDoclist : [];
    if (!documents.length && !docNamelist.length) {
      return next(new ErrorResponse("No changes made. Please update at least one field to continue.", 400));
    }

    const application = await findByCorporate(corporateUserId);
    if (!canModifyKybDocuments(application)) {
      return next(
        new ErrorResponse(
          "Your KYB application has already been submitted, so its documents can no longer be changed.",
          400
        )
      );
    }

    const unAcceptedDocument = [...documents, ...docNamelist.map((documentName) => ({ documentName }))].find(
      (doc) => !documentNames.includes(doc.documentName)
    );
    if (unAcceptedDocument) {
      return next(
        new ErrorResponse(
          `${documentLabel(unAcceptedDocument.documentName)} is not accepted.`,
          400
        )
      );
    }

    const invalidDocument = documents.find(
      // F-CC-17: fix the broken format check (was `=== "string"`, which never matched) so a missing/
      // non-string fileFormat is actually rejected instead of producing a broken upload.
      (doc) => typeof doc.fileBase !== "string" || !doc.fileBase || typeof doc.fileFormat !== "string" || !doc.fileFormat
    );
    if (invalidDocument) {
      return next(
        new ErrorResponse(
          `${documentLabel(invalidDocument.documentName)} could not be read. Please upload it again.`,
          400
        )
      );
    }

    const sizeLimits = await getMaxSizeKbMap(req?.LogTraceId);
    const limitKbFor = (documentName) => sizeLimits[documentName] || DEFAULT_MAX_SIZE_KB;
    const oversizedDocument = documents.find(
      (doc) => getBase64SizeInBytes(doc.fileBase) > limitKbFor(doc.documentName) * 1024
    );
    if (oversizedDocument) {
      return next(
        new ErrorResponse(
          `${documentLabel(oversizedDocument.documentName)} is larger than the ${sizeLabel(limitKbFor(oversizedDocument.documentName))} limit.`,
          400
        )
      );
    }

    const superseded = documents.length
      ? await findAllCorporateDocuments({
        corporateUserId,
        documentNames: documents.map((doc) => doc.documentName),
      })
      : [];

    const savedDocuments = [];
    for (const doc of documents) {
      const filePath = `${NODE_ENV || "staging"
        }/corporate/${username}/KYB-Documents`;
      const fileUrl = await uploadFileEncryptedToS3(doc.fileBase, filePath, doc.fileFormat);

      const params = {
        documentName: doc.documentName,
        document: fileUrl,
        documentType: doc.fileFormat,
        fileName: typeof doc.fileName === 'string' ? doc.fileName.slice(0, 255) : null,
        corporateUserId,
        expiryDate: doc?.expiryDate ? moment(doc?.expiryDate).format('YYYY-MM-DD') : null,
        sizeBytes: getBase64SizeInBytes(doc.fileBase),
      };
      await createCorporateDocument(params);
      savedDocuments.push(doc.documentName);
    }

    await discardStoredFiles(
      superseded.filter((row) => savedDocuments.includes(row.documentName)),
      req
    );

    let deletedDocuments = [];
    if (docNamelist.length > 0) {
      const doomed = await findAllCorporateDocuments({ corporateUserId, documentNames: docNamelist });
      await delectDocfiles({ docNamelist, corporateUserId });
      deletedDocuments = docNamelist;
      await discardStoredFiles(doomed, req);
      customLog(req?.LogTraceId, "info", { message: "Deleted documents successfully", data: { deletedDocuments } })
    }

    return res.status(200).json({
      status: true,
      message: "Your details have been saved successfully",
      responseCode: "000",
      data: { savedDocuments, deletedDocuments },
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    } else {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    }
    return next(
      new ErrorResponse("Something went wrong while uploading document", 500)
    );
  }
});

exports.findAllUploadedOneKYBDocs = asyncHandler(async (req, res) => {
  const { corporateId: corporateUserId } = req.user;

  const corporateDocuments = await findAllCorporateDocuments({
    corporateUserId,
    documentNames,
  });

  const documentsObject = corporateDocuments.reduce((acc, curr) => {
    acc[curr.documentName] = {
      fileName: curr.fileName,
      documentType: curr.documentType,
      expiryDate: curr.expiryDate,
      status: curr.status,
      uploadedAt: curr.updatedAt,
      sizeBytes: Number(curr.sizeBytes) || null,
    };
    return acc;
  }, {});

  const totalUsedBytes = corporateDocuments.reduce(
    (total, curr) => total + (Number(curr.sizeBytes) || 0),
    0
  );

  return res.status(200).json({
    status: true,
    message: "Documents fetched Successfully",
    responseCode: "000",
    data: {
      corporateDocuments: {
        ...documentsObject,
      },
      totalUsedBytes,
      totalLimitBytes: MAX_TOTAL_UPLOAD_KB * 1024,
    },
  });
});
