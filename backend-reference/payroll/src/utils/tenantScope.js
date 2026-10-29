const mongoose = require('mongoose');
const Employee = require('../models/entities/employee');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('./error-response');

// Keys that decide which corporate/employee a record belongs to. They must only
// ever come from the session (req.user) or a verified lookup, never the client.
const OWNERSHIP_FIELDS = ['_id', 'corporateUser', 'employee', '__v'];

// Returns a shallow copy of a client payload without ownership keys and Mongo
// operators ($set, $unset, ...), so it can't move a record into another corporate.
const sanitizeBody = (body, extraFields = []) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
    const blocked = new Set([...OWNERSHIP_FIELDS, ...extraFields]);
    return Object.fromEntries(
        Object.entries(body).filter(([key]) => !blocked.has(key) && !key.startsWith('$'))
    );
};

// True when the employee exists and belongs to the given corporate.
const isEmployeeOfCorporate = async (employeeId, corporateUser) => {
    if (!employeeId || !mongoose.isValidObjectId(employeeId)) return false;
    return !!(await Employee.exists({ _id: employeeId, corporateUser }));
};

// Of the given employee ids, returns only those that belong to the corporate.
const filterEmployeesOfCorporate = async (employeeIds = [], corporateUser) => {
    const validIds = employeeIds.filter((id) => mongoose.isValidObjectId(id));
    if (!validIds.length) return [];
    const owned = await Employee.find({ _id: { $in: validIds }, corporateUser }).select('_id').lean();
    const ownedSet = new Set(owned.map((e) => e._id.toString()));
    return employeeIds.filter((id) => ownedSet.has(String(id)));
};

// Route middleware: 404s unless the employee id at req.params[param] belongs to the
// logged-in corporate. Usage: router.post('/:employeeId', requireOwnedEmployee('employeeId'), handler)
const requireOwnedEmployee = (param = 'employeeId') => asyncHandler(async (req, res, next) => {
    const employeeId = req.params[param];
    if (!(await isEmployeeOfCorporate(employeeId, req.user._id))) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    next();
});

module.exports = {
    OWNERSHIP_FIELDS,
    sanitizeBody,
    isEmployeeOfCorporate,
    filterEmployeesOfCorporate,
    requireOwnedEmployee,
};
