const asyncHandler = require("../../middlewares/async");
const {
  createCorporateDocument,
  findAllCorporateDocuments,
  delectDocfiles,
} = require("../../models/use-cases/corporateDocuments");
const moment = require('moment');
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFileEncryptedToS3 } = require("../../utils/s3");
const { NODE_ENV } = process.env;

const documentNames = [
  "Pan_Card",
  "Signing_Authority_Pan_Card",
  "Aadhar_Card",
  "GST_Certificate",
  "Bank_Proof",
  "MOA_AOA",
  "Corporate_Agreement",
  "Certificate_Of_Incorporation",
  "Establishment_License",
  "Nature_Of_Business",
  "Proof_Of_Business"
];

exports.uploadOneKYBDocument = asyncHandler(async (req, res, next) => {
  try {
    const {
      corporateId: corporateUserId,
      username,
    } = req.user;
    const documents = req.body.documents;
    const docNamelist = req.body.deleteDoclist || [];
    if (!documents.length && docNamelist.length == 0) {
      return next(new ErrorResponse("No changes made. Please update at least one field to continue.", 500));
    }
    const unAcceptedDocument = documents.find(
      (doc) => !documentNames.includes(doc.documentName)
    );
    if (unAcceptedDocument) {
      return next(
        new ErrorResponse(
          `${unAcceptedDocument.documentName} is not accepted`,
          500
        )
      );
    }

    documents.forEach(async (doc) => {
      let fileUrl = "";
      // Upload files to S3 and store URLs
      const filePath = `${NODE_ENV || "staging"
        }/corporate/${username}/KYB-Documents`; if (doc.fileFormat === 'string') {
          fileUrl = doc.fileBase
        } else {
        fileUrl = await uploadFileEncryptedToS3(doc.fileBase, filePath, doc.fileFormat);
      }

      const params = {
        documentName: doc.documentName,
        document: fileUrl,
        documentType: doc.fileFormat,
        corporateUserId,
        expiryDate: doc?.expiryDate ? moment(doc?.expiryDate).format('YYYY-MM-DD') : null,
      };
      await createCorporateDocument(params);
    });

    if (Array.isArray(docNamelist) && docNamelist.length > 0) {
      const result = await delectDocfiles({docNamelist, corporateUserId});
    
      if (result) {
        customLog(req?.LogTraceId, "info", { message: "Deleted documents successfully"})
      } else {
        customLog(req?.LogTraceId, "error", { message: "Failed to delete documents"})
      }
    }

    return res.status(200).json({
      status: true,
      message: "Your details have been saved successfully",
      responseCode: "000",
      data: {},
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
      document: curr.document,
      expiryDate: curr.expiryDate,
      status: curr.status,
    };
    return acc;
  }, {});

  return res.status(200).json({
    status: true,
    message: "Documents fetched Successfully",
    responseCode: "000",
    data: {
      corporateDocuments: {
        ...documentsObject,
      },
    },
  });
});
