const {
  getAllDocuments,
  addEmployeeDocument,
  findEmployeeDocumentsInArray,
  documentNameExistsForEmployee,
  findEmployeeDocumentInArrayById,
  updateEmployeeDocumentInArray,
  deleteEmployeeDocumentFromArray,
} = require("../models/use-cases/documents");
const ErrorResponse = require("../utils/error-response");
const { formatDocName } = require('../services/formatDocName');
const asyncHandler = require("../middleware/async");
const { humanReadableDate } = require("../utils/dateUtils");
const { deleteFromS3 } = require("../utils/commonUploadFile");
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { documentUploaded } = require("../utils/email/emailTemplates/documentUploaded");

const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
  ? process.env.PRODUCTION_URL
  : process.env.FRONTEND_STAGING_URL;
const EMPLOYEE_DOCUMENTS_PATH = "/employee/documents";

// Notify the employee that the corporate has uploaded a document for them.
// Best-effort: a mail failure must never fail the upload.
async function emailDocumentUploaded({ req, corporateUserId, employee, documentType, logTraceId }) {
  try {
    const to = employee?.personalInformation?.email;
    if (!to) {
      customLog(logTraceId, "info", { message: "No email found for employee; skipped document uploaded email", employee: employee?._id });
      return;
    }

    const hrSettings = await findOneHrSettings(corporateUserId);
    const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only the
    // website/link falls back to the corporate's own saved website when there's no
    // genuine reseller partner registration, instead of Peko's own.
    const branding = {
      ...partnerBranding,
      website: isPartner ? partnerBranding?.website : (hrSettings?.corporateUser?.website || partnerBranding?.website),
    };
    const employeeName = employee?.personalInformation?.fullName;
    const viewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_DOCUMENTS_PATH}` : '';

    const resolvedEmail = await resolveDynamicEmail({
      req,
      key: PAYROLL_EMAIL_TEMPLATE_KEYS.DOCUMENT_UPLOADED,
      variables: {
        employeeName: employeeName || 'Employee',
        organizationName: companyName || 'Peko',
        documentType: documentType || '',
        ctaUrl: viewUrl,
        ...v2LayoutVariables(branding),
      },
      fallbackSubject: 'A New Document Has Been Uploaded for You',
      fallbackHtml: documentUploaded({
        companyName,
        employeeName,
        documentType,
        viewUrl,
      }, branding),
      partnerId: req.user?.registeredBy || null,
    });

    const response = await emailer.email(to, resolvedEmail.subject, resolvedEmail.html);
    if (!response?.status) {
      customLog(logTraceId, "error", { message: "Failed to send document uploaded email", error: response?.message });
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: "Failed to send document uploaded email", error: error?.message });
  }
}

exports.fetchAllDocuments = asyncHandler(async (req, res, next) => {

  const corporateUserID = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchText = req.query.searchText || "";
  const fullName = req.query.fullName || "";
  const skip = (page - 1) * limit;

  const params = {
    corporateUserID,
    page,
    limit,
    searchText,
    fullName,
    skip,
  };

  const result = await getAllDocuments(params);

  if (result.errors) {
    return next(
      new ErrorResponse("something went wrong while fetching documents", 400)
    );
  }

  return res.status(201).json({
    status: true,
    responseCode: "000",
    message: "Documents fetched successfully",
    data: result,
  });

})

exports.fetchDocumentsByEmployeeId = asyncHandler(async (req, res, next) => {

  const { employeeId } = req.params;
  const { page = 1, limit = 10, search } = req.query; // Set default values for page and limit

  const corporateUserId = req.user._id;
  const documentsData = await findEmployeeDocumentsInArray(employeeId, corporateUserId, { page, limit, search });

  if (!documentsData) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const formattedDocumentsData = documentsData.documents.map(document => ({
    name: formatDocName(document.name),
    expiryDate: document?.expiryDate ? humanReadableDate(document?.expiryDate) : "",
    _id: document?._id,
    url: document?.url,
    createdAt: document?.createdAt
  }));

  return res.status(200).json({
    status: true,
    message: "Documents fetched successfully",
    data: {
      documents: formattedDocumentsData,
      total: documentsData.total
    },
    responseCode: "000",
  });

})



exports.createDocument = asyncHandler(async (req, res, next) => {
  const { name, new_url, expiryDate, employee } = req.body;
  const documentData = {
    name,
    url: new_url,
    expiryDate,
  };

  const corporateUserId = req.user._id;

  const nameExists = await documentNameExistsForEmployee(employee, corporateUserId, name);
  if (nameExists) {
    return next(new ErrorResponse("Document with this name already exists", 400));
  }

  const employeeDetails = await addEmployeeDocument(employee, corporateUserId, documentData);

  if (!employeeDetails) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  await emailDocumentUploaded({
    req,
    corporateUserId,
    employee: employeeDetails,
    documentType: name,
    logTraceId: req?.LogTraceId,
  });

  res.status(200).json({
    status: true,
    data: employeeDetails,
    message: "Documents created successfully",
    responseCode: "000",
  });
})


//delete document
exports.deleteDocument = asyncHandler(async (req, res) => {

  const { documentId, employeeId } = req.params;
  const corporateUserId = req.user._id
  // Find the employee and check if it exists
  const result = await deleteEmployeeDocumentFromArray(documentId, employeeId, corporateUserId);
  if(result){
    await deleteFromS3(result.url.replace(/\/storage\.googleapis\.com/, ''), { username: req.user.username, corporateId: corporateUserId });
  }


  // Return success response
  res.status(200).json({
    status: true,
    message: "Document deleted successfully",
    responseCode: "000",
  });

})

// Update document
exports.updateDocument = asyncHandler(async (req, res) => {

  const { documentId, employeeId } = req.params;
  const { name, expiryDate } = req.body;
  let {url} = req.body;
  const corporateUserId = req.user._id
  if(req.body.new_url){
    const employeeDocument = await findEmployeeDocumentInArrayById(documentId, employeeId, corporateUserId);
    await deleteFromS3(employeeDocument.url.replace(/\/storage\.googleapis\.com/, ''), { username: req.user.username, corporateId: corporateUserId });
    url = req.body.new_url;
  }
  // Find the employee and check if it exists
  await updateEmployeeDocumentInArray(documentId, employeeId, corporateUserId, {
    name,
    url,
    expiryDate,
  })

  // Return success response
  res.status(200).json({ status: true, message: 'Document updated successfully', responseCode: '000' });
return
})
