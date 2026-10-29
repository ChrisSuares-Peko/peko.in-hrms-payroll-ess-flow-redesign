const DocumentRequest = require('../entities/documentRequest');
const Employee = require('../entities/employee');
const { escapeSearch } = require('../../utils/escapeRegex');

exports.createDocumentRequest = async (data) => DocumentRequest.create(data);

// Duplicate-request guard: at most one open (pending/in-progress) request per
// document type per employee.
exports.findOpenRequest = async (corporateUser, employeeId, documentType) =>
  DocumentRequest.findOne({
    corporateUser,
    employee: employeeId,
    documentType,
    status: { $in: ['pending', 'in-progress'] },
  });

// Employee's own "active requests" list — mirrors AE: only pending/in-progress
// ever show here. Once a request is fulfilled it drops out of this list; the
// employee is notified only by the fulfillment email, not in-app.
exports.findActiveRequestsByUser = async (corporateUser, employeeId, { from, to, page = 1, limit = 10 } = {}) => {
  const filter = {
    corporateUser,
    employee: employeeId,
    status: { $in: ['pending', 'in-progress'] },
  };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [records, total] = await Promise.all([
    DocumentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DocumentRequest.countDocuments(filter),
  ]);

  return { records, total };
};

// HR inbox — all requests across the corporate account, newest first.
exports.findDocumentRequestsByCorporate = async (corporateUser, { status, page = 1, limit = 10, searchText } = {}) => {
  const filter = { corporateUser };
  if (status && status !== 'all') filter.status = status;

  if (searchText) {
    const regex = new RegExp(escapeSearch(searchText), 'i');
    const matchingEmployees = await Employee.find({
      corporateUser,
      'personalInformation.fullName': regex,
    }).select('_id');

    filter.$or = [
      { employee: { $in: matchingEmployees.map(e => e._id) } },
      { documentType: regex },
      { status: regex },
    ];
  }

  const [records, total, pendingCount] = await Promise.all([
    DocumentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', 'personalInformation.fullName employeeInformation.employeeId'),
    DocumentRequest.countDocuments(filter),
    DocumentRequest.countDocuments({ corporateUser, status: 'pending' }),
  ]);

  return { records, total, pendingCount };
};

// Populates enough of the employee to address the fulfillment email.
exports.findRequestByIdForCorporate = async (corporateUser, requestId) =>
  DocumentRequest.findOne({ _id: requestId, corporateUser }).populate(
    'employee',
    'personalInformation.fullName personalInformation.email employeeInformation.workEmailId'
  );

exports.fulfillDocumentRequest = async (corporateUser, requestId, { uploadedDocument, remarks }) =>
  DocumentRequest.findOneAndUpdate(
    { _id: requestId, corporateUser },
    {
      $set: {
        uploadedDocument,
        remarks,
        status: 'completed',
        completedAt: new Date(),
      },
    },
    { new: true }
  );
