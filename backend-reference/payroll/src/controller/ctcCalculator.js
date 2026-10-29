const asyncHandler = require('../middleware/async');
const { getEmployeeCtcBreakdown } = require('../models/use-cases/ctcCalculator');
const { logAudit } = require('../services/auditLog');

exports.getEmployeeCtc = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const { employeeId } = req.params;

  const data = await getEmployeeCtcBreakdown({ corporateUserID, employeeId, includePfEarningsLine: true });

  logAudit({
    corporateUserID,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'VIEW_CTC',
    entity: 'CtcBreakdown',
    employeeId,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'CTC breakdown fetched successfully',
    data,
  });
});
