/**
 * Keeps pre-calculated Salary rows in sync with the payroll inputs they're derived from.
 *
 * Mounted once per API surface (corporate, ESS, e-sign callback) instead of in every
 * controller, so a new write route under an already-covered resource is synced
 * automatically. For each successful mutating request it works out which employees'
 * salaries the write can affect and marks their unpaid rows stale (services/salarySync.js)
 * BEFORE the response is sent — a client that refetches Salary Process right after saving
 * can never read the pre-change row.
 *
 * Resolution is deliberately conservative: when the affected employee can't be pinned
 * down, the whole payroll is marked (costs a recalculation, never a wrong salary).
 */
const mongoose = require('mongoose');
const Employee = require('../models/entities/employee');
const Bonus = require('../models/entities/bonus');
const Incentives = require('../models/entities/incentives');
const Overtime = require('../models/entities/overTime');
const Reimbursement = require('../models/entities/reimbursement');
const Deductions = require('../models/entities/deductions');
const LeaveApplication = require('../models/entities/leaveApplication');
const Increment = require('../models/entities/increment');
const AttendanceDispute = require('../models/entities/attendanceDispute');
const { markSalaryStale } = require('../services/salaryStaleMarker');
const { ensureCurrentMonthSalaryRecords } = require('../services/salarySync');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MARK_TIMEOUT_MS = 3000;

const ALL = { all: true };
const NONE = null;

const isObjectId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const findCorporateEmployee = async (corporateUserID, id) => {
  if (!isObjectId(id)) return null;
  return Employee.exists({ _id: id, corporateUser: corporateUserID });
};

// First path segment / body field that is one of this corporate's employees.
const findEmployeeInRequest = async (req, corporateUserID, segments) => {
  const candidates = [
    ...segments,
    req.body?.employee,
    req.body?.employeeId,
  ].filter(isObjectId);
  for (const candidate of candidates) {
    if (await findCorporateEmployee(corporateUserID, candidate)) return candidate;
  }
  if (req.body?.employeeEmail) {
    const byEmail = await Employee.findOne({
      corporateUser: corporateUserID,
      $or: [
        { 'personalInformation.email': req.body.employeeEmail },
        { 'employeeInformation.workEmailId': req.body.employeeEmail },
      ],
    }).select('_id').lean();
    if (byEmail) return String(byEmail._id);
  }
  return null;
};

// :id is either the employee (create) or the input document itself (edit/delete/status).
const employeeOrDocument = (Model) => async (req, corporateUserID, segments) => {
  const employeeId = await findEmployeeInRequest(req, corporateUserID, segments);
  if (employeeId) return { employeeIds: [employeeId] };
  const docId = segments.find(isObjectId);
  if (docId) {
    const doc = await Model.findOne({ _id: docId, corporateUser: corporateUserID }).select('employee').lean();
    if (doc?.employee) return { employeeIds: [String(doc.employee)] };
  }
  return ALL;
};

// Employee-level override when one is identifiable, otherwise a corporate-wide template.
const employeeOrAll = async (req, corporateUserID, segments) => {
  const employeeId = await findEmployeeInRequest(req, corporateUserID, segments);
  return employeeId ? { employeeIds: [employeeId] } : ALL;
};

const allUnless = (readOnlyPaths) => async (req, corporateUserID, segments) =>
  (readOnlyPaths.includes(segments[0]) ? NONE : ALL);

/**
 * Corporate API (/api/v1/corporate/:corporateId/payroll/<resource>/...), keyed by
 * <resource>. Every input processEmpSalary reads must be listed here (or hooked at its
 * write site when the write happens outside a mutating request).
 */
const CORPORATE_RULES = {
  bonus: employeeOrDocument(Bonus),
  incentives: employeeOrDocument(Incentives),
  overtime: employeeOrDocument(Overtime),
  reimbursement: employeeOrDocument(Reimbursement),
  deductions: employeeOrDocument(Deductions),
  'leave-application': employeeOrDocument(LeaveApplication),
  increment: employeeOrDocument(Increment),
  // Approving a dispute deletes the late/absent leave cut it was raised against.
  disputes: employeeOrDocument(AttendanceDispute),
  // Loss of Pay sheet: one save carries many employees' days. Only those employees are
  // marked (all their unpaid months, which also catches a one-time recovery's carry).
  'loss-of-pay': async (req, corporateUserID) => {
    const ids = (Array.isArray(req.body?.entries) ? req.body.entries : [])
      .map(entry => String(entry?.employeeId || ''))
      .filter(isObjectId);
    if (!ids.length) return NONE;
    const owned = await Employee.find({ _id: { $in: ids }, corporateUser: corporateUserID }).select('_id').lean();
    return owned.length ? { employeeIds: owned.map(e => String(e._id)) } : NONE;
  },

  // Salary structure: employee components / revise salary / undo, or global templates.
  'salary-component': employeeOrAll,
  'deduction-component': employeeOrAll,
  'leave-component': employeeOrAll,

  // Payroll-wide settings (tax regime, EPF/ESI/LWF, cycle, working days).
  'compliance-settings': () => ALL,
  'organization-settings': () => ALL,

  // Approval / mark-as-paid also settle bonus, incentive, overtime and reimbursement rows
  // for the whole corporate by calendar month, which can reach a still-unpaid month.
  salary: allUnless(['check-salary-details']),

  // DOJ, status, last working day, PF/ESI/LWF flags, offboarding, delete. A create (no
  // employee in the request) has no rows yet — its current month is generated instead.
  employee: async (req, corporateUserID, segments) => {
    const employeeId = await findEmployeeInRequest(req, corporateUserID, segments);
    if (employeeId) return { employeeIds: [employeeId], createCurrentMonth: true };
    return { createCurrentMonth: true };
  },
};

const applyScope = async (corporateUserID, scope, reason) => {
  if (!scope || !corporateUserID) return;
  if (scope.all) {
    await markSalaryStale({ corporateUserID, reason });
  } else if (scope.employeeIds) {
    await markSalaryStale({ corporateUserID, employeeIds: scope.employeeIds, reason });
  }
  if (scope.createCurrentMonth) ensureCurrentMonthSalaryRecords(corporateUserID);
};

const withTimeout = (promise) => Promise.race([
  promise,
  new Promise(resolve => setTimeout(resolve, MARK_TIMEOUT_MS)),
]);

/**
 * Builds the middleware. resolve(req) → { corporateUserID, scope } | null, run before the
 * handler (an edit/delete may remove or move the document the scope is derived from).
 */
const buildSalarySyncMiddleware = (resolve) => async (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();

  let resolved = null;
  try {
    resolved = await resolve(req);
  } catch (error) {
    resolved = null;
  }
  if (!resolved?.scope || !resolved?.corporateUserID) return next();

  const reason = `${req.method} ${req.baseUrl}${req.path}`;
  const originalJson = res.json.bind(res);
  let handled = false;

  // Marks regardless of the response outcome: a handler can persist the input and still
  // answer with an error (e.g. reimbursement saved, then the notification email fails).
  // Marking a row that didn't change only costs a recalculation, never a wrong salary.
  res.json = (body) => {
    if (handled) return originalJson(body);
    handled = true;
    withTimeout(applyScope(resolved.corporateUserID, resolved.scope, reason))
      .catch(() => {})
      .finally(() => originalJson(body));
    return res;
  };

  return next();
};

const pathSegments = (req) => req.path.split('/').filter(Boolean);

// Mounted in routes/index.js after authentication (req.user = corporate).
exports.syncSalaryForCorporateWrites = buildSalarySyncMiddleware(async (req) => {
  const segments = pathSegments(req);
  const rule = CORPORATE_RULES[segments[0]];
  if (!rule || !req.user?._id) return null;
  const corporateUserID = String(req.user._id);
  return { corporateUserID, scope: await rule(req, corporateUserID, segments.slice(1)) };
});

// ESS routes that create salary inputs for the signed-in employee: reimbursement and
// overtime requests/cancellations, leave apply/cancel, late check-in and absence cuts.
const ESS_SALARY_PATHS = ['reimbursement-requests', 'overtime-requests', 'leave-applications', 'leave', 'attendance'];

// Mounted in routes/user/index.js after authentication (req.user = employee).
exports.syncSalaryForEmployeeWrites = buildSalarySyncMiddleware(async (req) => {
  const [resource] = pathSegments(req);
  if (!ESS_SALARY_PATHS.includes(resource) || !req.user?._id) return null;
  const employee = await Employee.findById(req.user._id).select('corporateUser').lean();
  if (!employee?.corporateUser) return null;
  return {
    corporateUserID: String(employee.corporateUser),
    scope: { employeeIds: [String(employee._id)] },
  };
});

// E-sign offer-letter callback: a signed offer letter moves the employee into payroll.
exports.syncSalaryForEsignCallback = buildSalarySyncMiddleware(async (req) => {
  const employeeId = req.params?.employeeId;
  if (!isObjectId(employeeId)) return null;
  const employee = await Employee.findById(new mongoose.Types.ObjectId(employeeId)).select('corporateUser').lean();
  if (!employee?.corporateUser) return null;
  return {
    corporateUserID: String(employee.corporateUser),
    scope: { employeeIds: [employeeId], createCurrentMonth: true },
  };
});

exports.CORPORATE_RULES = CORPORATE_RULES;
