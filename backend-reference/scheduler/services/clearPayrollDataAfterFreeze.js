"use strict";

const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const setting = require("../models/entities/setting");
const { customLog } = require("../utils/loggerHelper");

// Mirrors users/utils/subscriptionLifecycleSettings.js. Cross-service imports aren't allowed
// so the lookup logic is duplicated here. Defaults stay in sync — update both if you change them.
const SETTING_NAME = "subscriptionLifecycle";
const DEFAULTS = Object.freeze({
  gracePeriodDays: 7,
  frozenPeriodDays: 30,
  payrollDataClearDays: 30,
});

const readLifecycleSettings = async () => {
  try {
    const row = await setting.findOne({ where: { name: SETTING_NAME }, raw: true });
    const stored = (row?.details && typeof row.details === "object") ? row.details : {};
    return {
      gracePeriodDays: Number(stored.gracePeriodDays) > 0 ? Number(stored.gracePeriodDays) : DEFAULTS.gracePeriodDays,
      frozenPeriodDays: Number(stored.frozenPeriodDays) > 0 ? Number(stored.frozenPeriodDays) : DEFAULTS.frozenPeriodDays,
      payrollDataClearDays: Number(stored.payrollDataClearDays) > 0 ? Number(stored.payrollDataClearDays) : DEFAULTS.payrollDataClearDays,
    };
  } catch (err) {
    customLog(null, "error", { message: "clearPayrollDataAfterFreeze: settings read failed — using defaults", error: err?.message });
    return { ...DEFAULTS };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA CLEAR FUNCTION — INTENTIONALLY COMMENTED OUT until product is ready
// to actually destroy payroll data. The scheduler still runs and identifies the
// eligible corporates (logs them, sends notifications), but does not invoke
// `clearPayrollData(corporateId)`. Uncomment when ready.
// ─────────────────────────────────────────────────────────────────────────────
//
// async function clearPayrollData(corporateId) {
//   // Deletes payroll-related rows for `corporateId` after the freeze window expires.
//   // Tables to clear (verify exact names with the Payroll team before enabling):
//   //   - payroll_employees           (employee master data)
//   //   - payroll_salaries            (salary structure rows)
//   //   - payroll_salary_runs         (monthly run history)
//   //   - payroll_leaves              (leave applications)
//   //   - payroll_attendance          (attendance records)
//   //   - payroll_reimbursements      (claims)
//   //   - payroll_announcements       (org announcements)
//   //   - payroll_documents           (uploaded employee documents in S3 — delete S3 keys too)
//   //
//   // Wrap in a sequelize transaction. After the SQL DELETEs commit, fire S3 deletes
//   // for any document keys that were attached to the deleted rows.
//   //
//   // Example skeleton (uncomment + adapt):
//   // const transaction = await sequelizeConfig.transaction();
//   // try {
//   //   await sequelizeConfig.query(`DELETE FROM payroll_attendance WHERE corporateUserId = :id`,
//   //     { replacements: { id: corporateId }, transaction });
//   //   await sequelizeConfig.query(`DELETE FROM payroll_leaves WHERE corporateUserId = :id`,
//   //     { replacements: { id: corporateId }, transaction });
//   //   await sequelizeConfig.query(`DELETE FROM payroll_salary_runs WHERE corporateUserId = :id`,
//   //     { replacements: { id: corporateId }, transaction });
//   //   await sequelizeConfig.query(`DELETE FROM payroll_salaries WHERE corporateUserId = :id`,
//   //     { replacements: { id: corporateId }, transaction });
//   //   await sequelizeConfig.query(`DELETE FROM payroll_employees WHERE corporateUserId = :id`,
//   //     { replacements: { id: corporateId }, transaction });
//   //   // ... other tables ...
//   //   await transaction.commit();
//   //   return { success: true };
//   // } catch (err) {
//   //   await transaction.rollback();
//   //   return { success: false, error: err?.message };
//   // }
// }

/**
 * Daily scheduler job.
 *
 * Finds corporates whose paid GROUP subscription expired more than
 * (gracePeriodDays + frozenPeriodDays + payrollDataClearDays) days ago AND who have not
 * re-subscribed (no ACTIVE paid plan in `subscriptions`). For each, logs the candidate and
 * (when enabled) calls `clearPayrollData(corporateId)`.
 *
 * Currently the call is commented out — the job is in dry-run mode. Logs every candidate
 * so the team can audit which corporates would be cleared once the function is enabled.
 */
exports.clearPayrollDataAfterFreeze = async () => {
  try {
    const settings = await readLifecycleSettings();
    const totalDaysBeforeClear = settings.gracePeriodDays + settings.frozenPeriodDays + settings.payrollDataClearDays;

    customLog(null, "info", {
      message: "clearPayrollDataAfterFreeze: scheduler tick",
      gracePeriodDays: settings.gracePeriodDays,
      frozenPeriodDays: settings.frozenPeriodDays,
      payrollDataClearDays: settings.payrollDataClearDays,
      totalDaysBeforeClear,
    });

    // Find corporates whose most recent paid GROUP subscription EXPIRED more than
    // `totalDaysBeforeClear` days ago AND who have no ACTIVE paid GROUP subscription now.
    // `subscriptionPaymentRefId IS NOT NULL` filters out Peko Free / unpaid rows.
    const candidates = await sequelizeConfig.query(
      `
      SELECT
        s.corporateUserId AS corporateId,
        MAX(s.subscriptionEndDate) AS lastPaidEndDate
      FROM subscriptions s
      JOIN packages p ON p.id = s.packageId
      WHERE s.isCustom = 0
        AND p.packageType = 'GROUP'
        AND s.status = 'EXPIRED'
        AND s.subscriptionPaymentRefId IS NOT NULL
      GROUP BY s.corporateUserId
      HAVING DATEDIFF(CURDATE(), MAX(s.subscriptionEndDate)) > :totalDaysBeforeClear
         AND NOT EXISTS (
           SELECT 1 FROM subscriptions s2
           JOIN packages p2 ON p2.id = s2.packageId
           WHERE s2.corporateUserId = s.corporateUserId
             AND s2.isCustom = 0
             AND p2.packageType = 'GROUP'
             AND s2.status = 'ACTIVE'
             AND s2.subscriptionPaymentRefId IS NOT NULL
         )
      `,
      { replacements: { totalDaysBeforeClear }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!candidates.length) {
      customLog(null, "info", { message: "clearPayrollDataAfterFreeze: no candidates today" });
      return;
    }

    customLog(null, "info", {
      message: "clearPayrollDataAfterFreeze: candidates identified",
      count: candidates.length,
      corporateIds: candidates.map((c) => c.corporateId),
    });

    for (const candidate of candidates) {
      const daysSinceExpiry = Math.floor(
        (Date.now() - new Date(candidate.lastPaidEndDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      customLog(null, "info", {
        message: "clearPayrollDataAfterFreeze: payroll data clear ELIGIBLE — would call clearPayrollData()",
        corporateId: candidate.corporateId,
        lastPaidEndDate: candidate.lastPaidEndDate,
        daysSinceExpiry,
        totalDaysBeforeClear,
        action: "DRY_RUN — actual clear is commented out at top of file",
      }, "VENDOR");

      // ── Enable when product is ready to actually destroy data ───────────
      // const result = await clearPayrollData(candidate.corporateId);
      // if (result?.success) {
      //   customLog(null, "info", { message: "clearPayrollDataAfterFreeze: data cleared", corporateId: candidate.corporateId });
      // } else {
      //   customLog(null, "error", { message: "clearPayrollDataAfterFreeze: clear failed", corporateId: candidate.corporateId, error: result?.error });
      // }
    }
  } catch (err) {
    customLog(null, "error", {
      message: "clearPayrollDataAfterFreeze: unexpected top-level error",
      error: err?.message,
      stack: err?.stack,
    }, "VENDOR");
    console.error("[clearPayrollDataAfterFreeze]", err?.message, err?.stack);
  }
};
