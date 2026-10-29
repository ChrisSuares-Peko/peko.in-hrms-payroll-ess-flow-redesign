const asyncHandler = require("../middleware/async");
const Reimbursement = require("../models/entities/reimbursement");
const ErrorResponse = require("../utils/error-response");
const emailer = require("../utils/email/emailer");
const {
  reimbursementEmailTemplate,
  reimbursementRejectedTemplate,
} = require("../utils/email/emailTemplates/reimbursement");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { getEmployeesUsingId } = require("../models/use-cases/employee");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { customLog } = require("../utils/loggerHelper");
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");
const {
  getAllReimbursements,
  getReimbursements,
} = require("../models/use-cases/reimbursement");

const OrganizationSettings = require("../models/entities/organizationSettings");
const { deleteFromS3 } = require("../utils/commonUploadFile");
const { humanReadableDateTime, humanReadableDate } = require("../utils/dateUtils");
const { generateExcelBufferAndType } = require("../utils/documentToBuffer");
const { fetchExternalFile } = require('../utils/safeFetch');

exports.createNewReimbursement = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const employeeId = req.params.id;
  // `status` is the employee-submission (ESS) lifecycle and is left unset for
  // HR-created reimbursements, so it is never taken from this payload.
  const reimbursementData = sanitizeBody(req.body, ["status"]);

  if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
    return next(new ErrorResponse("Employee not found", 404));
  }

   const existingOrganizationSettings = await OrganizationSettings.findOne({
      corporateUser: corporateUserID,
    })
  let logo = existingOrganizationSettings?.companyProfile?.companyLogo;

  
  await checkSalaryDate(
    req.body.expenseDate,
    employeeId
  );
  
  // if (!isVerified.status) {
  //   return next(new ErrorResponse(isVerified.message, 400));
  // }
  

  // commented out as salary date check is being done in the frontend and it was causing issues in editing reimbursement as well, as the salary date check was failing when we were trying to edit the reimbursement with the same date. We can uncomment this and remove the salary date check from the frontend once we are ready to handle that in the backend only.

  // if (!checkConditions) {
  //   return next(
  //     new ErrorResponse("The date that you have provided is not valid.", 400)
  //   );
  // }

  const newReimbursement = new Reimbursement({
    ...reimbursementData,
    corporateUser: corporateUserID,
    employee: employeeId,
  });

  const savedReimbursement = await newReimbursement.save();

  let employeeDetails = await getEmployeesUsingId(employeeId);

  if (employeeDetails) {
    let employeeName = employeeDetails.personalInformation.fullName;
    const companyName = existingOrganizationSettings?.companyProfile?.companyName || req.user?.companyName;
    const website = req.user?.website;
    const amount = `₹${Number(reimbursementData?.totalPay || 0).toLocaleString('en-IN')}`;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    const footerBranding = isPartner ? partnerBranding?.branding : undefined;

    const resolved = await resolveDynamicEmail({
      req,
      key: PAYROLL_EMAIL_TEMPLATE_KEYS.REIMBURSEMENT_PROCESSED,
      variables: {
        employeeName: employeeName || 'Employee',
        reimbursementReason: reimbursementData?.expenseDetails || '',
        amount,
        processedDate: reimbursementData?.expenseDate ? humanReadableDate(reimbursementData.expenseDate) : '',
        // branding shows the employee's own corporate in the header; the footer's
        // partner-icon-hiding gate uses the genuine reseller partner's brand instead
        // (undefined when there isn't one, so icons correctly show).
        ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding }),
      },
      fallbackSubject: 'Reimbursement Approved',
      fallbackHtml: reimbursementEmailTemplate(reimbursementData, employeeName, { logo, website, branding: companyName, footerBranding }),
      partnerId: req.user?.registeredBy || null,
    });

    let to = employeeDetails.personalInformation?.email;

    let { status, message } = await emailer.email(to, resolved.subject, resolved.html);

    if (!status) {
      return res.status(201).json({
        status: false,
        responseCode: "001",
        message: message || "Something went wrong.",
        data: {},
      });
    }
  }

  return res.status(201).json({
    status: true,
    responseCode: "000",
    message: "Reimbursement added successfully",
    data: savedReimbursement,
  });
});

exports.getReimbursementExcel = asyncHandler(async (req, res,next) => {
  const corporateUserID = req.user._id;
  const employeeId = req.params.id;
  const year = req.query.year;
  const month = req.query.month;
  const searchText = req.query.searchText || "";

  const reimbursements = await getAllReimbursements(
    corporateUserID,
    employeeId,
    null,
    null,
    year,
    month,
    searchText
  );

  let excelData = [];
  
      reimbursements.rows.forEach(reimbursement => {
        
          excelData.push({
              "Expense Date": humanReadableDateTime(reimbursement.expenseDate) ?? "N/A",
              "Expense Details": reimbursement.expenseDetails ?? "N/A",
              "Amount Paid": reimbursement.totalPay || "-",
              "Status": reimbursement?.paymentStatus?.charAt(0)?.toUpperCase() + reimbursement?.paymentStatus?.slice(1)?.toLowerCase() || "-",
              "Transfer Method": reimbursement.transferMethod || "-",
              "Supporting Doc":reimbursement.supportingDocs
          });
      });

      if(excelData.length === 0){
        return res.status(400).json({
          status: false,
          responseCode: '001',
          message: 'No data available to export',
          data: {},
        });
      }

 generateExcelBufferAndType(excelData)
        .then(({ buffer, fileType }) => {
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Reimbursement Excel generated successfully',
                data: { buffer, fileType },
            });
        })
        .catch(next);
});

exports.getAllReimbursementById = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const employeeId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const year = req.query.year;
  const month = req.query.month;
  const searchText = req.query.searchText || "";

  const reimbursements = await getAllReimbursements(
    corporateUserID,
    employeeId,
    page,
    limit,
    year,
    month,
    searchText
  );

  res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Reimbursements fetched successfully",
    data: reimbursements,
  });
});

exports.getAllReimbursement = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const year = req.query.year;
  const month = req.query.month;
  const searchText = req.query.searchText || "";

  

  const reimbursements = await getReimbursements(
    corporateUserID,
    page,
    limit,
    year,
    month,
    searchText
  );

  res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Reimbursements fetched successfully",
    data: reimbursements,
  });
});

exports.deleteReimbursementById = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const reimbursementId = req.params.id;
  const foundReimbursement = await Reimbursement.findOne({
    _id: reimbursementId,
    corporateUser: corporateUserID,
  });
  if (!foundReimbursement) {
    return next(
      new ErrorResponse(
        "Reimbursement not found or unauthorized to delete",
        400
      )
    );
  }

  if (foundReimbursement.paymentStatus === "PAID" || foundReimbursement.paymentStatus === "APPROVED") {
    return next(
      new ErrorResponse("The reimbursement can't be deleted because it is already been approved or paid", 400)
    );
  }

  // If payment status is not 'PAID', proceed with deletion
  if(foundReimbursement?.supportingDocs){
    await deleteFromS3(foundReimbursement.supportingDocs.replace(/\/storage\.googleapis\.com/, ''), { username: req.user.username, corporateId: req.user._id })
  }
  const deletedReimbursement = await Reimbursement.findOneAndDelete({
    _id: reimbursementId,
    corporateUser: corporateUserID,
  });

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Reimbursement deleted successfully",
    data: deletedReimbursement,
  });
});

// A reimbursement counts as processed once it is approved or paid.
const isProcessed = ({ status, paymentStatus }) =>
  status === "approved" || paymentStatus === "PAID" || paymentStatus === "APPROVED";

// ...and as rejected once either status field says so.
const isRejected = ({ status, paymentStatus }) =>
  status === "rejected" || paymentStatus === "REJECTED";

// Notify the employee of the decision on their reimbursement, approved or rejected.
// Best-effort: a mail failure must never fail the update.
async function emailReimbursementDecision({ req, corporateUserId, reimbursement, rejected, logTraceId }) {
  try {
    const employeeDetails = await getEmployeesUsingId(reimbursement.employee);
    if (!employeeDetails) return;

    const to = employeeDetails.personalInformation?.email;
    if (!to) {
      customLog(logTraceId, "info", {
        message: "No email found for employee; skipped reimbursement decision email",
        employee: reimbursement.employee,
      });
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

    const employeeName = employeeDetails.personalInformation?.fullName;
    const reason = reimbursement.expenseDetails;
    const amount = reimbursement.totalPay !== undefined && reimbursement.totalPay !== null
      ? `₹${Number(reimbursement.totalPay).toLocaleString('en-IN')}`
      : null;

    const resolved = rejected
      ? await resolveDynamicEmail({
          req,
          key: PAYROLL_EMAIL_TEMPLATE_KEYS.REIMBURSEMENT_DECISION_REJECTED,
          variables: {
            employeeName: employeeName || 'Employee',
            organizationName: companyName || 'Peko',
            detailLinesHtml: [
              `Reason: ${reason || 'Not specified'}`,
              `Amount: ${amount || 'Not specified'}`,
              `Rejection reason: ${reimbursement.notes || 'Not specified'}`,
            ].join('<br />'),
            ctaUrl: '',
            ...v2LayoutVariables(branding),
          },
          fallbackSubject: 'Reimbursement Request Rejected',
          fallbackHtml: reimbursementRejectedTemplate({
            employeeName,
            organizationName: companyName,
            reason,
            amount,
            rejectionReason: reimbursement.notes,
          }, branding),
          partnerId: req.user?.registeredBy || null,
        })
      : await resolveDynamicEmail({
          req,
          key: PAYROLL_EMAIL_TEMPLATE_KEYS.REIMBURSEMENT_DECISION_PROCESSED,
          variables: {
            employeeName: employeeName || 'Employee',
            organizationName: companyName || 'Peko',
            detailLinesHtml: [
              `Reason: ${reason || ''}`,
              `Amount: ${amount || ''}`,
            ].join('<br />'),
            ctaUrl: '',
            ...v2LayoutVariables(branding),
          },
          fallbackSubject: 'Reimbursement Processed Successfully',
          fallbackHtml: reimbursementEmailTemplate({ expenseDetails: reason, amount }, employeeName, { ...branding, footerBranding: branding?.branding }),
          partnerId: req.user?.registeredBy || null,
        });

    const response = await emailer.email(to, resolved.subject, resolved.html);
    if (!response?.status) {
      customLog(logTraceId, "error", {
        message: "Failed to send reimbursement decision email",
        error: response?.message,
      });
    }
  } catch (error) {
    customLog(logTraceId, "error", {
      message: "Failed to send reimbursement decision email",
      error: error?.message,
    });
  }
}

exports.updateReimbursement = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const reimbursementId = req.params.id;
  const updateData = sanitizeBody(req.body);

  const foundReimbursement = await Reimbursement.findOne({
    _id: reimbursementId,
    corporateUser: corporateUserID,
  });
  if (!foundReimbursement) {
    return next(
      new ErrorResponse("Reimbursement not found or unauthorized to edit", 400)
    );
  }

  // const checkConditions = await checkSalaryDate(
  //   req.body.expenseDate,
  //   req.body.employeeId
  // );



  if (foundReimbursement.paymentStatus === "PAID") {
    return next(
      new ErrorResponse("Cannot edit. Reimbursement is already paid.", 400)
    );
  }

  // fetchReimbursementsByEmployeeAndCorporateUser excludes
  // status:'requestedByEmployee' from payroll until HR reviews it.
  if (updateData.paymentStatus === "APPROVED") updateData.status = "approved";
  if (updateData.paymentStatus === "REJECTED") updateData.status = "rejected";

  // If payment status is not 'PAID', proceed with deletion
  const updateReimbursement = await Reimbursement.findOneAndUpdate(
    {
      _id: reimbursementId,
      corporateUser: corporateUserID,
    },
    updateData
  );

  // Only mail the employee when this update is what decides the reimbursement, so
  // unrelated edits (amount, date, notes) do not trigger a decision email.
  const merged = { ...foundReimbursement.toObject(), ...updateData };
  const nowRejected = isRejected(merged) && !isRejected(foundReimbursement);
  const nowProcessed = isProcessed(merged) && !isProcessed(foundReimbursement);
  if (nowRejected || nowProcessed) {
    await emailReimbursementDecision({
      req,
      corporateUserId: corporateUserID,
      reimbursement: merged,
      rejected: nowRejected,
      logTraceId: req?.LogTraceId,
    });
  }

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Reimbursement updated successfully",
    data: updateReimbursement,
  });
});

exports.getReimbursementData = asyncHandler(async (req, res, next) => {
  const { reimbursementId } = req.params;
  const reimbursementData = await Reimbursement.findOne({
    _id: reimbursementId,
    corporateUser: req.user._id,
  });
  if (!reimbursementData) {
    return next(
      new ErrorResponse(
        "something went wrong while fetching reimbursement data",
        400
      )
    );
  } else {
    return res.status(201).json({
      status: true,
      data: reimbursementData,
      message: "reimbursement data fetched successfully",
      responseCode: "000",
    });
  }
});

exports.downloadReimbursementDocument = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const reimbursementId = req.params.id;

  const reimbursement = await Reimbursement.findOne({
    _id: reimbursementId,
    corporateUser: corporateUserID,
  });
  if (!reimbursement || !reimbursement.supportingDocs) {
    return next(new ErrorResponse("Document not found", 404));
  }

  const response = await fetchExternalFile(reimbursement.supportingDocs);
  const extension = reimbursement.supportingDocs.split(".").pop().split(/[?#]/)[0] || "pdf";
  const name = "Reimbursement";

  res.set("Content-Type", response.headers["content-type"] || "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename="${name}.${extension}"`);
  return res.send(response.data);
});
