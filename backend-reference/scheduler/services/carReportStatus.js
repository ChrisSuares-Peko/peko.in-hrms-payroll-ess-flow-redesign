// Car Reports completion sweep — guarantees the report-ready email even when nothing
// else completes an order: valuation orders whose Droom webhook never fired, and
// history orders paid on the Cashfree leg (which has no Droom client). Runs alongside
// officeAndBusiness's read-time completion; both flip orders with conditional UPDATEs,
// so whoever wins sends the one email.
const axios = require("axios");
const { Op } = require("sequelize");
const carReportOrder = require("../models/entities/carReportOrder");
const credential = require("../models/entities/credential");
const { refundWalletTransaction } = require("../utils/walletTransaction");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { partnerLogos } = require("../utils/partnerLogos");
const emailer = require("../utils/emailer");
const { generateReportReadyEmail } = require("../utils/email/emailTemplates/carReport");
const { customLog } = require("../utils/loggerHelper");
const operatorsData = require("../utils/operatorsData.json");
const {
  extractPaasReport,
  normaliseHistoryResult,
  summariseChallans,
  cleanReportUrl,
} = require("../utils/carReport");

const { accessKey } = operatorsData.carReport;
const COMPANY_ID = process.env.DROOM_COMPANY_ID || "1109";
const POLL_DELAY_MS = 500;
// Give the payment-time flows a head start; stop retrying after two days.
const MIN_AGE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDroomToken = async (vendor) => {
  // Challan-layout columns, same as officeAndBusiness/services/droomClient.js.
  const { apiUrl, optional1: clientId, optional2: clientSecret, optional4: username, optional5: password } = vendor;
  const response = await axios.post(
    `${apiUrl}/dss/v1/oauth/token`,
    new URLSearchParams({ grant_type: "password", client_id: clientId, client_secret: clientSecret, scope: "*", username, password }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (!response.data?.access_token) throw new Error("Droom token response had no access_token");
  return response.data.access_token;
};

const droomGet = async (vendor, token, path, params) => {
  const response = await axios({
    method: "get",
    url: `${vendor.apiUrl}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
};

const sendReadyEmail = async (row) => {
  try {
    const cred = await credential.findOne({
      where: { id: row.credentialId },
      attributes: ["email", "username", "name", "registeredBy"],
      raw: true,
    });
    const to = cred?.email || cred?.username;
    if (!to) return;
    const partnerData = cred.registeredBy ? await fetchPartnerDetails(cred.registeredBy) : await partnerLogos();
    const body = generateReportReadyEmail(
      cred.name || "Customer",
      partnerData,
      row.reportName,
      row.vehicleNumber || row.vehicleModel || "",
      row.corporateTxnId
    );
    emailer.email(to, `Your ${row.reportName} is ready`, body, () => {});
  } catch (error) {
    customLog(null, "error", { message: "Report-ready email failed", corporateTxnId: row.corporateTxnId, error: error.message }, "CAR_REPORT");
  }
};

// Conditional on BUILDING — only the caller that flips the row emails.
const completeOrder = async (row, updates) => {
  const [affected] = await carReportOrder.update(
    { ...updates, reportStatus: "READY" },
    { where: { id: row.id, reportStatus: "BUILDING" } }
  );
  if (affected) await sendReadyEmail({ ...row, ...updates });
  return affected;
};

const cancelAndRefund = async (row, message) => {
  const [affected] = await carReportOrder.update(
    { reportStatus: "CANCELLED" },
    { where: { id: row.id, reportStatus: "BUILDING" } }
  );
  if (!affected) return;
  customLog(null, "error", { message: `Car report refunded by sweep — ${message}`, corporateTxnId: row.corporateTxnId }, "CAR_REPORT");
  await refundWalletTransaction({
    corporateTxnId: row.corporateTxnId,
    status: "FAILURE",
    providerId: row.corporateTxnId,
    message,
    orderResponse: JSON.stringify({ message }),
  });
};

const sweepValuation = async (vendor, token, row) => {
  // Never ordered from Droom (payment-leg outage on the Cashfree leg has no client at
  // all) — creating needs the full form mapping, which stays with officeAndBusiness's
  // read path. Only ordered reports are polled here.
  if (!row.vendorReference) return;
  const body = await droomGet(vendor, token, "/dss/v2/paas-report-status", {
    company_id: COMPANY_ID,
    order_id: row.vendorReference,
  });
  const paas = extractPaasReport(body);
  if (paas && paas.status === "completed" && paas.reportUrl) {
    await completeOrder(row, {
      reportUrl: paas.reportUrl,
      reportPath: paas.reportPath || null,
      vendorResponse: JSON.stringify(body),
    });
  } else if (paas && paas.status === "failed") {
    await cancelAndRefund(row, "Valuation report could not be generated");
  }
};

const sweepHistory = async (vendor, token, row) => {
  const rcBody = await droomGet(vendor, token, "/dss/v1/vehicle-rc-details", { rc_number: row.vehicleNumber });
  const ok = rcBody && String(rcBody.code || "").toLowerCase() === "success";
  const historyResult = ok ? normaliseHistoryResult(rcBody.data) : null;
  if (!historyResult) {
    // Refund only on a definitive no-vehicle answer (2xx with no vehicle, or the
    // vendor's explicit "Data not found") — mirrors carReportHistory.js. Auth answered
    // as 200/"failed" and unknown failures stay BUILDING for the next tick.
    if (ok || /data not found/i.test(String(rcBody?.message || ""))) {
      await cancelAndRefund(row, "Vehicle history unavailable for this registration number");
    }
    return;
  }

  // Challans and the PDF are tolerated separately — an outage costs that piece, not the report.
  try {
    const challans = summariseChallans(await droomGet(vendor, token, "/dss/v1/vehicle-challan-details", { rc_number: row.vehicleNumber }));
    if (challans) historyResult.challans = challans;
  } catch (error) {
    customLog(null, "info", { message: "Sweep challan lookup failed", corporateTxnId: row.corporateTxnId }, "CAR_REPORT");
  }

  const updates = {
    historyResult,
    vendorResponse: JSON.stringify(rcBody),
    vendorReference: historyResult.registrationNumber || row.vehicleNumber || null,
  };
  if (historyResult.modelName) updates.vehicleModel = historyResult.modelName;
  if (historyResult.bodyType && !row.bodyType) updates.bodyType = historyResult.bodyType;
  try {
    const pdfBody = await droomGet(vendor, token, "/dss/v1/vehicle-rc-challan-report", { rc_number: row.vehicleNumber });
    if (pdfBody && String(pdfBody.code || "").toLowerCase() === "success") {
      updates.reportUrl = cleanReportUrl(pdfBody.data?.report_path);
    }
  } catch (error) {
    customLog(null, "info", { message: "Sweep history PDF fetch failed", corporateTxnId: row.corporateTxnId }, "CAR_REPORT");
  }

  await completeOrder(row, updates);
};

exports.sweepCarReportStatus = async () => {
  try {
    const now = Date.now();
    const rows = await carReportOrder.findAll({
      where: {
        reportStatus: "BUILDING",
        reportType: { [Op.in]: ["valuation", "history"] },
        orderDate: { [Op.lt]: new Date(now - MIN_AGE_MS), [Op.gt]: new Date(now - MAX_AGE_MS) },
      },
      raw: true,
    });
    if (!rows.length) return;

    const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceOperator || serviceOperator.error || !serviceOperator.vendor) {
      customLog(null, "error", { message: "Car report sweep: Droom vendor not configured" }, "CAR_REPORT");
      return;
    }
    const vendor = serviceOperator.vendor;
    const token = await getDroomToken(vendor);

    customLog(null, "info", { message: `Car report sweep: ${rows.length} building order(s)` }, "CAR_REPORT");
    for (const row of rows) {
      try {
        if (row.reportType === "valuation") await sweepValuation(vendor, token, row);
        else await sweepHistory(vendor, token, row);
      } catch (error) {
        // Transient vendor/network failure — the next sweep retries this order.
        customLog(null, "error", { message: "Car report sweep failed for order", corporateTxnId: row.corporateTxnId, error: error?.response?.data || error.message }, "CAR_REPORT");
      }
      await sleep(POLL_DELAY_MS);
    }
  } catch (error) {
    customLog(null, "error", { message: "Car report sweep crashed", error: error.message }, "CAR_REPORT");
  }
};
