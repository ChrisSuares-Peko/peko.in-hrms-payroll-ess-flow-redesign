const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/error-response");
const OrganizationSettings = require("../models/entities/organizationSettings");
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { documentRequestFulfilledTemplate } = require("../utils/email/emailTemplates/documentRequestFulfilled");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const {
  findDocumentRequestsByCorporate,
  findRequestByIdForCorporate,
  fulfillDocumentRequest,
} = require("../models/use-cases/documentRequest");

const STATUS_VALUES = ['pending', 'in-progress', 'completed', 'rejected'];

exports.listAllDocumentRequestsForCorporate = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user._id;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const { status, searchText } = req.query;

  if (status && status !== 'all' && !STATUS_VALUES.includes(status)) {
    return next(new ErrorResponse('Invalid status filter', 400));
  }

  const { records, total, pendingCount } = await findDocumentRequestsByCorporate(corporateUser, { status, page, limit, searchText });

  const mapped = records.map(r => {
    const json = r.toJSON();
    const employee = json.employee || {};
    return {
      ...json,
      employee: {
        id: employee.id || employee._id,
        fullName: employee.personalInformation?.fullName,
        employeeId: employee.employeeInformation?.employeeId,
      },
    };
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Document requests fetched successfully',
    data: { records: mapped, total, pendingCount, page, limit, filters: { status } },
  });
});

// Fulfil a pending/in-progress request: upload the file, mark it completed,
// and email the employee the attachment. Matches AE — there is no in-app
// notification of fulfillment, and no reject action.
exports.uploadDocumentRequest = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user._id;
  const { requestId } = req.params;
  const { document, note } = req.body;

  const request = await findRequestByIdForCorporate(corporateUser, requestId);
  if (!request) return next(new ErrorResponse('Document request not found', 404));
  if (!['pending', 'in-progress'].includes(request.status)) {
    return next(new ErrorResponse(`Request already ${request.status}`, 400));
  }

  const url = document;
  const format = url.split('.').pop().split('?')[0];

  const uploadedDocument = {
    name: request.documentType,
    url,
    format,
    uploadedAt: new Date(),
    uploadedBy: corporateUser,
  };

  const updated = await fulfillDocumentRequest(corporateUser, requestId, { uploadedDocument, remarks: note });

  // Fire-and-forget: failure to email should not fail the corporate admin's request.
  // emailWithAttachment never throws on a send failure (it catches internally and
  // returns { status: false, message }), so that return value must be checked
  // explicitly — otherwise a failed send (e.g. an SMTP provider block) is
  // completely silent beyond an unstructured console.error inside emailer.js.
  (async () => {
    const employee = request.employee || {};
    const to = [employee.personalInformation?.email, employee.employeeInformation?.workEmailId]
      .filter(Boolean)
      .join(', ');
    try {
      if (!to) {
        customLog(req?.LogTraceId, 'error', {
          message: 'Document request fulfillment email skipped: employee has no email on file',
          requestId,
        });
        return;
      }

      const organizationSettings = await OrganizationSettings.findOne({ corporateUser });
      const logo = organizationSettings?.companyProfile?.companyLogo || req.user?.logo;
      const companyName = organizationSettings?.companyProfile?.companyName || req.user?.companyName;
      const website = req.user?.website;
      const employeeName = employee.personalInformation?.fullName;
      const partnerBranding = await fetchPartnerBranding(req);
      const isPartner = !!req.user?.registeredBy;
      const footerBranding = isPartner ? partnerBranding?.branding : undefined;

      const resolved = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.DOCUMENT_REQUEST_FULFILLED,
        variables: {
          name: employeeName || 'Employee',
          company: companyName || '',
          // branding shows the employee's own corporate in the header; the footer's
          // partner-icon-hiding gate uses the genuine reseller partner's brand instead
          // (undefined when there isn't one, so icons correctly show).
          ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding }),
        },
        fallbackSubject: `Requested Document - ${request.documentType}`,
        fallbackHtml: documentRequestFulfilledTemplate({ employeeName, companyName, logo, website, footerBranding }),
        partnerId: req.user?.registeredBy || null,
      });

      const result = await emailer.emailWithAttachment(to, resolved.subject, resolved.html, `${request.documentType}.${format}`, url);
      if (!result?.status) {
        customLog(req?.LogTraceId, 'error', {
          message: 'Document request fulfillment email failed to send',
          requestId,
          to,
          error: result?.message,
        });
      }
    } catch (error) {
      customLog(req?.LogTraceId, 'error', {
        message: 'Failed to send document request fulfillment email',
        requestId,
        to,
        error: error?.message,
      });
    }
  })();

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Document uploaded successfully',
    data: updated,
  });
});
