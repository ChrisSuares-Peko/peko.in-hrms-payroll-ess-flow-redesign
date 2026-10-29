const asyncHandler = require("../../middlewares/async");
const {
  createBulk,
  update,
  getAllGuidelines,
  bulkUpdate,
  bulkDelete,
  findGuidelineById,
  getReminderDashboard,
} = require("../../models/use-cases/invoiceGuideline");
const { findInvoice } = require("../../models/use-cases/invoicingV2");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const emailer = require("../../utils/emailer");
const sms = require("../../utils/sms");
const { resolveInvoiceReminderEmail } = require("../../utils/emailTemplates/invoicingV2");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");


exports.createGuideline = asyncHandler(async (req, res, next) => {
  try {
    let { data } = req.body;
    // Every guideline attaches to an invoice the caller must own.
    const invoiceIds = [...new Set((data || []).map((g) => g.invoiceId))];
    for (const invoiceId of invoiceIds) {
      const ownedInvoice = await findInvoice({ id: invoiceId, corporateUserId: req.user.corporateId });
      if (!ownedInvoice) return next(new ErrorResponse("Invoice not found", 404));
    }
    const result = await createBulk(data);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while adding guideline`, 500)
      );
    }
    return res.status(201).json({
      status: true,
      message: "Guideline added successfully.",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateGuideline = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    let params = req.params;
    // Guidelines are owned via their parent invoice — reject cross-tenant ids.
    const guideline = await findGuidelineById(params.id);
    if (!guideline) return next(new ErrorResponse("Guideline not found", 404));
    const ownedInvoice = await findInvoice({ id: guideline.invoiceId, corporateUserId: req.user.corporateId });
    if (!ownedInvoice) return next(new ErrorResponse("Guideline not found", 404));
    const result = await update(data, params);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while updating guideline`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { result },
        message: "Guideline updated successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateGuidelines = asyncHandler(async (req, res, next) => {
  let { data, invoiceId } = req.body;
  const guidelineData = data;

  // Reject edits to another tenant's invoice guidelines; this also scopes the
  // customer email/phone lookup below to an invoice the caller actually owns.
  const invoiceDetails = await findInvoice({ id: invoiceId, corporateUserId: req.user.corporateId });
  if (!invoiceDetails) return next(new ErrorResponse("Invoice not found", 404));

  const currentGuidelines = await getAllGuidelines({ invoiceId });

  const deleteGuidelinesId = currentGuidelines.rows
    .filter((data) => {
      guidelineData.forEach((newGuideline) => {
        if (newGuideline.id === data.id) return false;
      });
      return true;
    })
    .map((data) => data.id);

  await bulkDelete(deleteGuidelinesId);

  guidelineData.map((guideline, index1) => {
    guidelineData.forEach((i, index2) => {
      if (guideline.days === i.days && index1 !== index2) {
        return next(
          new ErrorResponse(
            `Only one guideline can be set per day. Please select a different day to add another guideline.`,
            500
          )
        );
      }
    });
  });

  const customerEmail = invoiceDetails?.email || "";
  const customerPhone = invoiceDetails?.phoneNumber || "";

  const newUpdatedData = guidelineData.map((data) => {
    if (data.sms && data.templet?.sms) {
      data.templet.sms.mobileNo = customerPhone;
    }
    if (data.email && data.templet?.email) {
      data.templet.email.emailId = customerEmail;
    }
    return data;
  });

  await bulkUpdate(newUpdatedData);
  res.send({ status: true });
});

exports.bulkUpdateGuideline = asyncHandler(async (req, res, next) => {
  try {
    let { data } = req.body;
    // Every guideline attaches to an invoice the caller must own.
    const invoiceIds = [...new Set((data || []).map((g) => g.invoiceId))];
    for (const invoiceId of invoiceIds) {
      const ownedInvoice = await findInvoice({ id: invoiceId, corporateUserId: req.user.corporateId });
      if (!ownedInvoice) return next(new ErrorResponse("Invoice not found", 404));
    }
    const result = await bulkUpdate(data);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while updating guideline`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {},
        message: "Guideline updated successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getAllGuidelines = asyncHandler(async (req, res, next) => {
  try {
    let params = req.params;
    // Only the invoice's owner may read its guidelines.
    const ownedInvoice = await findInvoice({ id: params.invoiceId, corporateUserId: req.user.corporateId });
    if (!ownedInvoice) return next(new ErrorResponse("Invoice not found", 404));
    const result = await getAllGuidelines(params);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while getting guideline`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: result,
        message: "Guidelines fetched successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.sendReminder = async (req, res, next) => {
  try {
    const guideline = await findGuidelineById(req.params.id);
    if (!guideline) return next(new ErrorResponse("Reminder not found", 404));
    // Ownership via parent invoice — a cross-tenant send must 404, not relay.
    const ownedInvoice = await findInvoice({ id: guideline.invoiceId, corporateUserId: req.user.corporateId });
    if (!ownedInvoice) return next(new ErrorResponse("Reminder not found", 404));
    if (guideline.status === "COMPLETED")
      return next(new ErrorResponse("Reminder already sent", 400));
    if (guideline.status === "CANCELLED")
      return next(new ErrorResponse("Reminder is cancelled", 400));

    const { email, sms: sendSms, templet, registeredBy } = guideline;

    let partnerData;
    try {
      partnerData = await fetchPartnerDetails(registeredBy);
    } catch (_) {
      partnerData = await fetchPartnerDetails();
    }

    if (email && templet?.email) {
      const { body, emailId, subject } = templet.email;
      const { subject: emailSubject, html: bodyHtml, sender } = await resolveInvoiceReminderEmail(body, partnerData, {
        fallbackSubject: subject,
        partnerId: registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      try {
        emailer.email(emailId, emailSubject, bodyHtml, undefined, sender);
      } catch (e) {
        customLog(req?.LogTraceId, "error", {
          message: "Email send failed: " + e.message,
        });
      }
    }

    if (sendSms && templet?.sms) {
      const { body, mobileNo } = templet.sms;
      try {
        await sms.sendSMS(mobileNo, body);
      } catch (e) {
        customLog(req?.LogTraceId, "error", {
          message: "SMS send failed: " + e.message,
        });
      }
    }

    await update({ status: "COMPLETED" }, { id: req.params.id });
    return res.status(200).json({
      status: true,
      data: {},
      message: "Reminder sent successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    next(new ErrorResponse(error.message, 500));
  }
};

exports.cancelReminder = async (req, res, next) => {
  try {
    const guideline = await findGuidelineById(req.params.id);
    if (!guideline) return next(new ErrorResponse("Reminder not found", 404));
    const ownedInvoice = await findInvoice({ id: guideline.invoiceId, corporateUserId: req.user.corporateId });
    if (!ownedInvoice) return next(new ErrorResponse("Reminder not found", 404));
    const result = await update(
      { status: "CANCELLED" },
      { id: req.params.id }
    );
    if (!result) return next(new ErrorResponse("Reminder not found", 404));
    return res.status(200).json({
      status: true,
      data: {},
      message: "Reminder cancelled",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    next(new ErrorResponse(error.message, 500));
  }
};

exports.getReminderDashboard = async (req, res, next) => {
  try {
    const corporateUserId = req.user.corporateId;
    let { status, searchText, sortField, page, itemsPerPage, from, to } =
      req.query;
    const sort = req.query.sort === "ASC" ? "ASC" : "DESC";

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : undefined;
    const limit = itemsPerPage || undefined;
    const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : 0;

    const params = {
      corporateUserId,
      status,
      searchText,
      sort,
      sortField,
      limit,
      offset,
      from: from || undefined,
      to: to || undefined,
    };
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
    }

    const result = await getReminderDashboard(params);
    return res.status(200).json({
      status: true,
      data: result,
      message: "Reminder dashboard fetched",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    next(new ErrorResponse(error.message, 500));
  }
};
