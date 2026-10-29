const puppeteer = require("puppeteer");
const fs = require("fs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const ondc = require("../../services/ondc");
const { waitForOnIssue, cancelIssueWait } = require("../../services/ondcIssueWaiter");
const {
  findAllOndcIssuesAndCount,
  findOneOndcIssueByIdAdmin,
} = require("../../models/use-cases/ondc_issue");
const { recordOndcIssueEvent } = require("../../models/use-cases/ondc_issue_event");
const ondcOrders = require("../../models/entities/ondc_order");
const corporateUser = require("../../models/entities/corporateUser");
const credential = require("../../models/entities/credential");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

const { TERMINAL_ISSUE_STATUSES } = require("../../utils/ondcIgmStatus");

// The subset of the shared OPEN|ACKNOWLEDGED|INFO_REQUESTED|RESPONSE_RECEIVED|
// RESOLVED|REJECTED|ESCALATED|CLOSED vocabulary (models/entities/ondc_issue.js)
// that make sense as an admin/RESPONDENT-initiated action — mirrors what
// buildIssueActionsFromEvents/recordOndcIssueEvent already expect eventType
// to be for a RESPONDENT row.
const ADMIN_RESPONSE_ACTIONS = ["ACKNOWLEDGED", "INFO_REQUESTED", "RESOLVED", "REJECTED"];

/**
 * Reconstructs the full {complainant_actions, respondent_actions} history IGM
 * expects echoed on every /issue call — same shape/logic as the private
 * helper of the same name in controllers/corporate/ondcEcommerce.js (buyer
 * side), duplicated here rather than exported/imported since it's a small,
 * self-contained mapper and the two controllers should be free to diverge.
 */
const buildIssueActionsFromEvents = (events, newAction) => {
  const complainantActions = (events || [])
    .filter((e) => e.actorType === "COMPLAINANT")
    .map((e) => ({ complainant_action: e.eventType === "CLOSED" ? "CLOSE" : "OPEN", short_desc: e.message, updated_at: e.occurredAt }));
  const respondentActions = (events || [])
    .filter((e) => e.actorType === "RESPONDENT")
    .map((e) => ({ respondent_action: e.eventType, short_desc: e.message, updated_at: e.occurredAt }));

  if (newAction.complainant_action) complainantActions.push(newAction);
  else respondentActions.push(newAction);

  return { complainantActions, respondentActions };
};

/** Batch-resolves {corporateName, vendorName} for a page of issue rows. */
const enrichIssuesForAdmin = async (issues) => {
  const corporateIds = [...new Set(issues.map((i) => i.corporateUserId).filter(Boolean))];
  const orderIds = [...new Set(issues.map((i) => i.ondcOrderId).filter(Boolean))];

  const [corporates, orders] = await Promise.all([
    corporateIds.length
      ? corporateUser.findAll({ where: { id: corporateIds }, attributes: ["id", "name"], raw: true })
      : [],
    orderIds.length
      ? ondcOrders.findAll({ where: { id: orderIds }, attributes: ["id", "vendorName"], raw: true })
      : [],
  ]);
  const corporateNameById = new Map(corporates.map((c) => [c.id, c.name]));
  const vendorNameByOrderId = new Map(orders.map((o) => [o.id, o.vendorName]));

  return issues.map((issue) => ({
    id: issue.id,
    displayId: `ISS-${1000 + issue.id}`,
    ondcOrderId: issue.ondcOrderId,
    orderId: issue.orderId,
    category: issue.category,
    subCategory: issue.subCategory,
    status: issue.status,
    corporateName: corporateNameById.get(issue.corporateUserId) || "-",
    vendorName: vendorNameByOrderId.get(issue.ondcOrderId) || "-",
    createdAt: issue.createdAt,
  }));
};

const parseListParams = (query) => {
  let { from, to, searchText, page, itemsPerPage, status, category, bppId } = query;
  const needsAttention = query.needsAttention === "true";
  const sort = query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = query.sortField || "id";
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  const offset = (page - 1) * itemsPerPage;
  return {
    from, to, searchText, status: needsAttention ? undefined : status, category, bppId,
    statusNotIn: needsAttention ? TERMINAL_ISSUE_STATUSES : undefined,
    sort, sortField, offset, limit: itemsPerPage,
  };
};

/** "Issues" tab list — the admin ops view over every buyer's ONDC issues. */
exports.findAllIssues = asyncHandler(async (req, res) => {
  const params = parseListParams(req.query);
  const { count, rows } = await findAllOndcIssuesAndCount(params);
  const data = await enrichIssuesForAdmin(rows);
  return res.status(200).json({
    status: true,
    data: { recordsTotal: count, recordsFiltered: count, data },
    message: "Issues fetched successfully",
    responseCode: "000",
  });
});

/** Count of currently-open (non-terminal) issues — the "Issues (N)" tab badge. */
exports.getOpenIssuesCount = asyncHandler(async (req, res) => {
  const { count } = await findAllOndcIssuesAndCount({ statusNotIn: TERMINAL_ISSUE_STATUSES, limit: 1 });
  return res.status(200).json({
    status: true,
    data: { count },
    message: "Open issues count fetched successfully",
    responseCode: "000",
  });
});

exports.issuesExcelCSV = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const params = parseListParams(req.query);
  const { rows } = await findAllOndcIssuesAndCount({ ...params, offset: 0, limit: 10000 });
  const data = await enrichIssuesForAdmin(rows);
  if (!data.length) {
    return next(new ErrorResponse("No data is available for export", 500));
  }
  const { buffer, fileType } = await generateExcelBufferAndType(data, type);
  return res.status(200).json({
    status: true,
    data: { buffer, fileType },
    message: "Fetched excel/csv data successfully",
    responseCode: "000",
  });
});

exports.issuesPDF = asyncHandler(async (req, res, next) => {
  const params = parseListParams(req.query);
  const { rows } = await findAllOndcIssuesAndCount({ ...params, offset: 0, limit: 10000 });
  const data = await enrichIssuesForAdmin(rows);
  if (!data.length) {
    return next(new ErrorResponse("No data is available for export", 500));
  }

  const reportHtmlWithStyle = reportPdfTemplate(data, { title: "Issues" });
  const random = new Date().valueOf();
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });
  const outputFile = `report-${random}.pdf`;
  await page.pdf({ scale: 0.6, path: outputFile, format: "A4", preferCSSPageSize: true });
  const buffer = fs.readFileSync(outputFile);
  browser.close();
  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: "report generated successfully.",
    data: { buffer, fileType: "application/pdf" },
    responseCode: "000",
  });
});

/** Single-issue detail (full thread) for the admin view/respond drawer. */
exports.getIssueByIdAdmin = asyncHandler(async (req, res, next) => {
  const issue = await findOneOndcIssueByIdAdmin({ id: req.params.id });
  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }
  const [corporate, order] = await Promise.all([
    issue.corporateUserId
      ? corporateUser.findOne({
          where: { id: issue.corporateUserId },
          attributes: ["id", "name"],
          include: [{ model: credential, attributes: ["username"] }],
        })
      : null,
    issue.ondcOrderId
      ? ondcOrders.findOne({
          where: { id: issue.ondcOrderId },
          attributes: ["id", "vendorName", "totalAmount", "currency"],
          raw: true,
        })
      : null,
  ]);
  const corporateCode = corporate && corporate.credential ? corporate.credential.username : null;
  return res.status(200).json({
    status: true,
    data: {
      id: issue.id,
      displayId: `ISS-${1000 + issue.id}`,
      createdAt: issue.createdAt,
      orderId: issue.orderId,
      // numeric ondcOrders.id so the frontend Order card can link to the
      // order-detail route /manage/orders/details/:id
      ondcOrderId: issue.ondcOrderId,
      category: issue.category,
      subCategory: issue.subCategory,
      status: issue.status,
      corporateName: corporate?.name || "-",
      corporateCode,
      vendorName: order?.vendorName || "-",
      orderTotal: order?.totalAmount || null,
      orderCurrency: order?.currency || null,
      events: [...issue.events].reverse().map((e) => ({
        eventType: e.eventType,
        actorType: e.actorType,
        actorName: e.actorName,
        message: e.message,
        images: e.images || [],
        occurredAt: e.occurredAt,
      })),
    },
    message: "Issue fetched successfully",
    responseCode: "000",
  });
});

/**
 * Admin response — mirrors the buyer-side respondToOndcIssue in
 * controllers/corporate/ondcEcommerce.js, but as the RESPONDENT side: sends a
 * real IGM respondent_action to the seller (not a complainant_action) and
 * records the event with actorType RESPONDENT. `action` must be one of
 * ADMIN_RESPONSE_ACTIONS — the eventType passed to recordOndcIssueEvent IS
 * what moves ondcIssues.status (see touchOndcIssueStatus).
 */
exports.respondToIssueAdmin = asyncHandler(async (req, res, next) => {
  const { message: replyText, action, clientRequestId } = req.body;
  if (!ADMIN_RESPONSE_ACTIONS.includes(action)) {
    return next(new ErrorResponse(`action must be one of ${ADMIN_RESPONSE_ACTIONS.join(", ")}`, 422));
  }
  if (!replyText) {
    return next(new ErrorResponse("message is required", 422));
  }

  const issue = await findOneOndcIssueByIdAdmin({ id: req.params.id });
  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }
  if (TERMINAL_ISSUE_STATUSES.includes(issue.status)) {
    return next(new ErrorResponse(`This issue is already ${issue.status.toLowerCase()}`, 400));
  }

  const now = new Date().toISOString();
  const { complainantActions, respondentActions } = buildIssueActionsFromEvents(issue.events, {
    respondent_action: action,
    short_desc: replyText,
    updated_at: now,
  });

  const wait = waitForOnIssue(issue.issueId, { timeoutMs: 15000 });
  try {
    await ondc.issue({
      bppId: issue.bppId,
      bppUri: issue.bppUri,
      issueId: issue.issueId,
      orderId: issue.orderId,
      category: issue.category,
      subCategory: issue.subCategory,
      complainantActions,
      respondentActions,
      transactionId: issue.transactionId,
    });
  } catch (ondcErr) {
    cancelIssueWait(issue.issueId, "issue_failed");
    return next(new ErrorResponse(ondcErr.message || "Couldn't send the response to the seller — you can try again", 502));
  }

  await recordOndcIssueEvent({
    ondcIssueId: issue.id,
    eventType: action,
    actorType: "RESPONDENT",
    actorName: "Peko Support",
    message: replyText,
    images: [],
    sourceAction: "LOCAL_RESPOND",
    occurredAt: now,
    dedupeKey: clientRequestId,
  });

  await wait;

  return res.status(200).json({
    status: true,
    message: "Your response has been sent to the seller",
    responseCode: "000",
    data: {},
  });
});
