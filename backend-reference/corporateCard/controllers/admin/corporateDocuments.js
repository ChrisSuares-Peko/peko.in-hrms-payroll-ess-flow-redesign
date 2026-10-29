const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { findAllCorporateDocuments } = require("../../models/use-cases/corporateDocuments");
const { findByCorporate } = require("../../models/use-cases/corporateCardAdminApplication");
const { REVIEWABLE_DOCUMENT_NAMES, reviewChecklistFor } = require("../../constants/kybDocuments");
const { buildKybDocumentPack } = require("../../services/kybDocumentPack");
const { customLog } = require("../../utils/loggerHelper");
const { findByCorporate: findAgreement } = require("../../models/use-cases/corporateCardAgreement");
const { missingRequired } = require("../corporate/corporateAgreement");
const { deriveKybProgress } = require("../../utils/kybProgress");

exports.findCorporateDocumentsForAdmin = asyncHandler(async (req, res) => {
  const { corporateId } = req.params;

  const [corporateDocuments, application, agreement] = await Promise.all([
    findAllCorporateDocuments({ corporateUserId: corporateId, documentNames: REVIEWABLE_DOCUMENT_NAMES }),
    findByCorporate(corporateId),
    findAgreement(corporateId),
  ]);

  const documentsObject = corporateDocuments.reduce((acc, curr) => {
    acc[curr.documentName] = {
      document: curr.document,
      documentType: curr.documentType,
      fileName: curr.fileName,
      expiryDate: curr.expiryDate,
      status: curr.status,
      uploadedAt: curr.updatedAt,
    };
    return acc;
  }, {});

  const expected = reviewChecklistFor(application?.businessType, Object.keys(documentsObject), {
    addressProofSameAsGst: agreement?.addressProofSameAsGst === true,
    agreementSignMethod: application?.agreementSignMethod || null,
  });
  const expectedNames = new Set(expected.map((entry) => entry.documentName));
  const extras = Object.keys(documentsObject)
    .filter((documentName) => !expectedNames.has(documentName))
    .map((documentName) => ({ documentName, label: documentName.replace(/_/g, " "), required: false }));

  return res.status(200).json({
    status: true,
    message: "Documents fetched Successfully",
    responseCode: "000",
    data: {
      businessType: application?.businessType || null,
      // No per-step timestamp exists — every one of these lands on the single application updatedAt,
      // which the reviewer's own edits bump — so the steps carry state only, never a date.
      kybStatus: application?.kybStatus || null,
      rejectionReason: application?.metadata?.rejectionReason || null,
      progress: deriveKybProgress({
        application,
        agreement,
        expected,
        uploadedDocumentNames: Object.keys(documentsObject),
        missingRequired,
      }),
      documents: [...expected, ...extras],
      corporateDocuments: {
        ...documentsObject,
      },
    },
  });
});

exports.downloadAllCorporateDocumentsForAdmin = asyncHandler(async (req, res, next) => {
  const corporateId = Number(req.params.corporateId);
  if (!Number.isInteger(corporateId) || corporateId <= 0) {
    return next(new ErrorResponse("A valid corporate is required.", 400));
  }

  const pack = await buildKybDocumentPack({
    corporateId,
    logTraceId: req?.LogTraceId,
    documentNames: REVIEWABLE_DOCUMENT_NAMES,
  });

  if (!pack?.archive) {
    return next(new ErrorResponse("This corporate has no documents to download yet.", 404));
  }

  customLog(req?.LogTraceId, "info", {
    action: "corporateCard:adminDocuments:downloadAll",
    message: "[CorporateDocuments] Admin downloaded the KYB document pack",
    corporateId,
    documentCount: pack.attached.length,
    omitted: pack.omitted,
    archiveBytes: pack.totalBytes,
  }, "CONSOLE");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="corporate-${corporateId}_KYB-Documents.zip"`);
  res.setHeader("Content-Length", pack.archive.length);
  return res.status(200).send(pack.archive);
});
