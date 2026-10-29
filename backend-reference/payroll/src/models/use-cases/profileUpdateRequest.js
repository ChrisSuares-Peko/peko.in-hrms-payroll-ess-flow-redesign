const ProfileUpdateRequest = require('../entities/profileUpdateRequest');
const Employee = require('../entities/employee');
const { escapeSearch } = require('../../utils/escapeRegex');

exports.createProfileUpdateRequest = async (data) => ProfileUpdateRequest.create(data);

// Duplicate-request guard: at most one open request per type per employee.
exports.findOpenRequestByType = async (corporateUser, employee, type) =>
  ProfileUpdateRequest.findOne({ corporateUser, employee, type, status: 'requestedByEmployee' });

// Human-facing labels the search box should also match against, mapped to the real enum values.
const STATUS_SEARCH_LABELS = { pending: 'requestedByEmployee', approved: 'approved', rejected: 'rejected' };
const TYPE_SEARCH_LABELS = { profile: 'profileDetails', bank: 'bankDetails' };

// HR inbox listing — includes every status (Pending/Approved/Rejected) by
// default so approved/rejected requests stay visible as history, not just
// pending ones; `status` param narrows it when HR filters explicitly.
exports.findProfileRequestsByCorporate = async (corporateUser, { type, status, page, limit, searchText }) => {
  const filter = { corporateUser };
  if (type && type !== 'all') filter.type = type;
  if (status && status !== 'all') filter.status = status;

  if (searchText) {
    const term = searchText.trim().toLowerCase();
    const regex = new RegExp(escapeSearch(searchText), 'i');

    const matchingEmployees = await Employee.find({
      corporateUser,
      $or: [
        { 'personalInformation.fullName': regex },
        { 'employeeInformation.employeeId': regex },
        { 'employeeInformation.designation': regex },
      ],
    }).select('_id');

    const searchOr = [{ employee: { $in: matchingEmployees.map(e => e._id) } }];

    Object.entries(TYPE_SEARCH_LABELS).forEach(([label, value]) => {
      if (label.includes(term) || term.includes(label)) searchOr.push({ type: value });
    });
    Object.entries(STATUS_SEARCH_LABELS).forEach(([label, value]) => {
      if (label.includes(term) || term.includes(label)) searchOr.push({ status: value });
    });

    filter.$and = [{ $or: searchOr }];
  }

  const [records, total, pendingCount] = await Promise.all([
    ProfileUpdateRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', 'personalInformation.fullName employeeInformation.employeeId employeeInformation.designation'),
    ProfileUpdateRequest.countDocuments(filter),
    ProfileUpdateRequest.countDocuments({ corporateUser, status: 'requestedByEmployee' }),
  ]);

  return { records, total, pendingCount };
};

exports.findProfileRequestByIdForCorporate = async (corporateUser, requestId) =>
  ProfileUpdateRequest.findOne({ _id: requestId, corporateUser });

// Used by the single-record review endpoint; populates enough of the live
// employee doc to fall back on if a request predates the currentData snapshot.
exports.findProfileRequestDetailForCorporate = async (corporateUser, requestId) =>
  ProfileUpdateRequest.findOne({ _id: requestId, corporateUser }).populate(
    'employee',
    'personalInformation employeeInformation'
  );

exports.updateProfileRequestStatus = async (corporateUser, requestId, { status, remarks }) =>
  ProfileUpdateRequest.findOneAndUpdate(
    { _id: requestId, corporateUser },
    { $set: { status, ...(remarks !== undefined ? { remarks } : {}) } },
    { new: true }
  );
