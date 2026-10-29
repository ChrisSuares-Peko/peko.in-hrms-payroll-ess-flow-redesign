const { Op } = require("sequelize");
const nupayVerificationRecord = require('../entities/nupayVerificationRecord');
const credential = require('../entities/credential');

exports.createVerificationRecord = async (data) => {
  return await nupayVerificationRecord.create(data);
};

exports.findOneVerificationRecordByReference = async (referenceNumber, credentialId) => {
  const where = { referenceNumber };
  if (credentialId) {
    where.credentialId = credentialId;
  }
  return await nupayVerificationRecord.findOne({ where });
};

exports.updateVerificationRecordByReference = async (referenceNumber, data) => {
  await nupayVerificationRecord.update(data, {
    where: { referenceNumber }
  });
};

exports.findAllVerificationRecordsAndCount = async (params) => {
  const {
    credentialId,
    page = 1,
    itemsPerPage = 10,
    searchText = '',
    status = 'ALL',
    sort = 'DESC',
    sortField = 'createdAt',
    from,
    to,
  } = params;

  // PENDING records are still awaiting a vendor/webhook result, not a finished verification - never
  // surfaced in the corporate's own history list, even if explicitly requested via status=PENDING.
  const whereClause = { credentialId, status: { [Op.ne]: 'PENDING' } };

  if (status && status !== 'ALL' && status !== 'PENDING') {
    whereClause.status = status;
  }

  if (searchText) {
    whereClause[Op.or] = [
      { verificationType: { [Op.like]: `%${searchText}%` } },
      { referenceNumber: { [Op.like]: `%${searchText}%` } },
      { transactionId: { [Op.like]: `%${searchText}%` } },
    ];
  }

  if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [new Date(from), endDate],
    };
  }

  return await nupayVerificationRecord.findAndCountAll({
    where: whereClause,
    order: [[sortField, sort]],
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
  });
};

// Admin/systemUser equivalent of findAllVerificationRecordsAndCount above - lists across ALL
// corporates (not scoped to one credentialId), for the admin verification-history screen. Reads
// from this common verification-records table instead of the legacy transaction/order tables, since
// status here is a real column (VALID/INVALID/PENDING) rather than something extracted from JSON.
exports.findAllVerificationRecordsAndCountForAdmin = async (params) => {
  const {
    limit,
    offset,
    searchText = '',
    sort = 'DESC',
    column = 'createdAt',
    from,
    to,
    status,
    registeredBy,
  } = params;

  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());

  const whereClause = {};

  if (safeSearch) {
    whereClause[Op.or] = [
      { referenceNumber: { [Op.like]: `%${safeSearch}%` } },
      { transactionId: { [Op.like]: `%${safeSearch}%` } },
      { verificationType: { [Op.like]: `%${safeSearch}%` } },
      { '$credential.name$': { [Op.like]: `%${safeSearch}%` } },
      { '$credential.username$': { [Op.like]: `%${safeSearch}%` } },
    ];
  }

  if (status && status !== 'ALL') {
    whereClause.status = status.toUpperCase();
  }

  if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [new Date(from), endDate],
    };
  }

  if (registeredBy) {
    whereClause['$credential.registeredBy$'] = registeredBy;
  }

  return await nupayVerificationRecord.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: credential,
        attributes: ["name", "email", "username"],
        include: [
          {
            model: credential,
            as: "registeredByCredential",
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [[column, sort]],
    limit,
    offset,
    subQuery: false,
  });
};

// Local, independent copies of the small formatting helpers verificationSuite.js's legacy
// verificationTransactionsExcelCSV uses (that file doesn't export them) - kept separate on purpose so
// this V2/verification-records report path never depends on the old transaction/order report code.
const formatServiceField = (text) => {
  const knownAcronyms = ['PAN', 'CIN', 'DIN', 'DL', 'IFSC', 'GST', 'KYC'];
  if (!text || typeof text !== 'string') return '';

  const upperText = text.toUpperCase();
  if (knownAcronyms.includes(upperText)) {
    return upperText;
  }

  const normalized = text.trim().toLowerCase();
  if (normalized === 'epic_number') return 'EPIC Number';

  return text
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formattedDateTime = (datetime) =>
  new Date(datetime).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

// Admin PDF/Excel-CSV report data, sourced from nupay_verification_records instead of the legacy
// transaction/order tables - shares one function for both PDF and Excel/CSV exports, same as the
// legacy verificationTransactionsExcelCSV does for both of its callers. Row shape (key names) matches
// the legacy report's columns so reportPdfTemplate/generateExcelBufferAndType render the same way;
// "Amount" is always 0 since V2 verification calls carry no per-call payment, and "Result"/"Status"
// end up equal since this table's own status column already IS the VALID/INVALID/PENDING verdict,
// unlike the legacy JSON-sniffing that had to distinguish payment-status from verification-result.
exports.getVerificationRecordsReportForAdmin = async (params) => {
  const {
    from,
    to,
    searchText = '',
    sort = 'DESC',
    sortField = 'createdAt',
    status,
    registeredBy,
  } = params;

  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());

  const whereClause = {};

  if (safeSearch) {
    whereClause[Op.or] = [
      { referenceNumber: { [Op.like]: `%${safeSearch}%` } },
      { transactionId: { [Op.like]: `%${safeSearch}%` } },
      { verificationType: { [Op.like]: `%${safeSearch}%` } },
      { '$credential.name$': { [Op.like]: `%${safeSearch}%` } },
      { '$credential.username$': { [Op.like]: `%${safeSearch}%` } },
    ];
  }

  if (status && status !== 'ALL') {
    whereClause.status = status.toUpperCase();
  }

  if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [new Date(from), endDate],
    };
  }

  if (registeredBy) {
    whereClause['$credential.registeredBy$'] = registeredBy;
  }

  const rows = await nupayVerificationRecord.findAll({
    where: whereClause,
    include: [
      {
        model: credential,
        attributes: ["name", "username"],
        include: [
          {
            model: credential,
            as: "registeredByCredential",
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [[sortField, sort]],
    subQuery: false,
  });

  return rows.map((row) => {
    const inputPayload = row.inputPayload || {};
    const inputDetailsFormatted = Object.entries(inputPayload)
      .map(([key, value]) => `${formatServiceField(key === 'phone' ? 'Mobile Number' : key)}: ${value}`)
      .join(', ');

    return {
      "Transaction Date": row.createdAt ? formattedDateTime(row.createdAt) : 'Not Available',
      "Transaction ID": row.referenceNumber || 'Not Available',
      "Corporate ID": row.credential?.username || 'Not Available',
      "Corporate Name": row.credential?.name || 'Not Available',
      "Partner Name": row.credential?.registeredByCredential?.name || 'Not Available',
      "Verification Type": row.verificationType || 'Not Available',
      "Input Details": inputDetailsFormatted || 'Not Available',
      "Result": row.status === 'VALID' ? 'VALID' : 'INVALID',
      Amount: "₹ 0.00",
      Status: row.status || 'Not Available',
    };
  });
};

// Corporate-facing equivalent of getVerificationRecordsReportForAdmin above (same row shape, same
// V2/verification-records source) - scoped to one credentialId instead of filtered by registeredBy,
// for the corporate's own PDF/Excel-CSV export of getVerificationHistoryV2's data.
exports.getVerificationRecordsReportForCorporate = async (params) => {
  const {
    from,
    to,
    searchText = '',
    sort = 'DESC',
    sortField = 'createdAt',
    status,
    credentialId,
  } = params;

  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());

  // PENDING records are still awaiting a vendor/webhook result, not a finished verification - never
  // surfaced in the corporate's own history export, mirroring findAllVerificationRecordsAndCount.
  const whereClause = { credentialId, status: { [Op.ne]: 'PENDING' } };

  if (safeSearch) {
    whereClause[Op.or] = [
      { referenceNumber: { [Op.like]: `%${safeSearch}%` } },
      { transactionId: { [Op.like]: `%${safeSearch}%` } },
      { verificationType: { [Op.like]: `%${safeSearch}%` } },
    ];
  }

  if (status && status !== 'ALL' && status !== 'PENDING') {
    whereClause.status = status.toUpperCase();
  }

  if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [new Date(from), endDate],
    };
  }

  const rows = await nupayVerificationRecord.findAll({
    where: whereClause,
    order: [[sortField, sort]],
    subQuery: false,
  });

  return rows.map((row) => {
    const inputPayload = row.inputPayload || {};
    const inputDetailsFormatted = Object.entries(inputPayload)
      .map(([key, value]) => `${formatServiceField(key === 'phone' ? 'Mobile Number' : key)}: ${value}`)
      .join(', ');

    return {
      "Date": row.createdAt ? formattedDateTime(row.createdAt) : 'Not Available',
      "Verification Type": row.verificationType || 'Not Available',
      "Input Details": inputDetailsFormatted || 'Not Available',
      "Result": row.status === 'VALID' ? 'VALID' : 'INVALID',
    };
  });
};

// Scoped to the corporate's current plan-cycle window (see getVerificationUsageStatus in
// utils/verificationQuota.js, which mirrors eSign's countESignDocs plan-cycle/calendar-month logic).
// Scoped to the corporate's CURRENT packageId, not just corporateUserId+date - a verification record
// stores whichever packageId was active when it happened, so filtering on the current one naturally
// excludes usage from a since-switched-away-from plan (e.g. Peko Go usage no longer counts once
// downgraded back to Peko Free) without needing to know exactly when that switch happened.
exports.countVerificationRecordsThisMonth = async ({ corporateUserId, packageId, from, to }) => {
  const dateWhere = { corporateUserId, packageId, createdAt: { [Op.between]: [from, to] } };

  const [count, validCount, invalidCount, pendingCount, lastVerification] = await Promise.all([
    nupayVerificationRecord.count({ where: dateWhere }),
    nupayVerificationRecord.count({ where: { ...dateWhere, status: 'VALID' } }),
    nupayVerificationRecord.count({ where: { ...dateWhere, status: 'INVALID' } }),
    nupayVerificationRecord.count({ where: { ...dateWhere, status: 'PENDING' } }),
    nupayVerificationRecord.findOne({
      where: { corporateUserId },
      order: [['createdAt', 'DESC']],
      attributes: ['createdAt'],
    }),
  ]);

  return {
    count,
    validCount,
    invalidCount,
    pendingCount,
    lastVerificationAddedDate: lastVerification ? lastVerification.createdAt : null,
  };
};
