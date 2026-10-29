const asyncHandler = require("../../middlewares/async");
const paymentLinkOnboarding = require("../entities/paymentLinkOnboarding");

/**
 * Find onboarding record for a credential.
 * Returns null if not yet started.
 */
exports.findOnboardingByCredential = asyncHandler(async (credentialId) => {
  return await paymentLinkOnboarding.findOne({
    where: { credentialId },
    raw: true,
  });
});

/**
 * Upsert Step 1 — business name + bank details.
 * Creates the record if none exists, otherwise updates it.
 */
exports.saveStep1 = asyncHandler(async ({ credentialId, businessName, bankName, accountNumber, ifsc }) => {
  const existing = await paymentLinkOnboarding.findOne({ where: { credentialId } });

  if (existing) {
    await existing.update({ businessName, bankName, accountNumber, ifsc });
    return existing;
  }

  return await paymentLinkOnboarding.create({
    credentialId,
    businessName,
    bankName,
    accountNumber,
    ifsc,
    status: "pending",
  });
});

/**
 * Save PAN step — store verified PAN and derived business name.
 * Creates the onboarding record if one does not exist yet (PAN is now step 1).
 */
exports.savePanStep = asyncHandler(async ({ credentialId, pan, businessName }) => {
  let record = await paymentLinkOnboarding.findOne({ where: { credentialId } });

  if (!record) {
    record = await paymentLinkOnboarding.create({
      credentialId,
      businessName: businessName || '',
      pan,
      panVerifiedAt: new Date(),
      status: 'pending',
    });
    return record;
  }

  const updates = { pan, panVerifiedAt: new Date() };
  if (businessName) updates.businessName = businessName;
  await record.update(updates);
  return record;
});

/**
 * Save bank verification step — mark bank account as verified.
 */
exports.saveBankStep = asyncHandler(async ({
  credentialId,
  accountNumber,
  ifsc,
  bankName,
  accountHolderName,
  phone,
  bankVerificationResponse,
}) => {
  const record = await paymentLinkOnboarding.findOne({ where: { credentialId } });

  if (!record) {
    const err = new Error("Onboarding record not found. Complete Step 1 first.");
    err.statusCode = 400;
    throw err;
  }

  const updates = { bankVerifiedAt: new Date() };
  if (accountNumber) updates.accountNumber = accountNumber;
  if (ifsc) updates.ifsc = ifsc.toUpperCase();
  if (bankName) updates.bankName = bankName;
  if (accountHolderName) updates.accountHolderName = accountHolderName;
  if (phone) updates.phone = phone;
  if (bankVerificationResponse) updates.bankVerificationResponse = bankVerificationResponse;

  await record.update(updates);
  return record;
});

/**
 * Save Step 2 — consent accepted, mark as active.
 * Stores v2 VA fields (existing), v3 VA fields, and settlement account URN.
 */
exports.saveStep2AndActivate = asyncHandler(async ({
  credentialId,
  virtualAccountNumber,
  virtualIfsc,
  phone,
  activeStatus = "active"
}) => {
  const record = await paymentLinkOnboarding.findOne({ where: { credentialId } });

  if (!record) {
    const err = new Error("Onboarding record not found. Complete Step 1 first.");
    err.statusCode = 400;
    throw err;
  }

  await record.update({
    status: activeStatus,
    consentAcceptedAt: new Date(),
    activatedAt: new Date(),
    virtualAccountNumber,
    virtualIfsc,
    ...(phone ? { phone } : {}),
  });

  return record;
});

/**
 * Update virtual account details after provider creates it.
 */
exports.updateVirtualAccount = asyncHandler(async ({ credentialId, virtualAccountId, virtualAccountNumber, virtualIfsc, providerResponse }) => {
  const [updated] = await paymentLinkOnboarding.update(
    { virtualAccountId, virtualAccountNumber, virtualIfsc, providerResponse },
    { where: { credentialId } }
  );
  return updated;
});

exports.updateOnboardingProfile = asyncHandler(async ({ credentialId, businessName, phone, email, address }) => {
  const updates = {};
  if (businessName) updates.businessName = businessName;
  if (phone)        updates.phone        = phone;
  if (email)        updates.email        = email;
  if (address)      updates.address      = address;

  await paymentLinkOnboarding.update(updates, { where: { credentialId } });
});

exports.suspendOnboarding = asyncHandler(async ({ credentialId }) => {
  const record = await paymentLinkOnboarding.findOne({ where: { credentialId } });
  if (!record) {
    const err = new Error('Onboarding record not found');
    err.statusCode = 404;
    throw err;
  }
  await record.update({ status: 'suspended', deactivatedAt: new Date() });
  return record;
});

/**
 * Admin: paginated list of all onboarding records with optional search and date filter.
 */
exports.findAllOnboardingByAdmin = asyncHandler(async ({ limit, offset, searchText, sort, sortField, from, to }) => {
  const { Op } = require('sequelize');
  const credential = require('../entities/credential');

  const where = {};
  if (from && to) {
    where.createdAt = { [Op.between]: [new Date(from), new Date(to + 'T23:59:59')] };
  }

  if (searchText) {
    where[Op.or] = [
      { pan: { [Op.like]: `%${searchText}%` } },
      { '$credential.name$': { [Op.like]: `%${searchText}%` } },
    ];
  }

  const order = [[sortField || 'createdAt', sort || 'DESC']];

  const result = await paymentLinkOnboarding.findAndCountAll({
    where,
    include: [
      {
        model: credential,
        attributes: ['name'],
        required: false,
      },
    ],
    order,
    limit: limit || 10,
    offset: offset || 0,
    raw: true,
    nest: true,
  });

  return {
    count: result.count,
    rows: result.rows.map(row => ({
      ...row,
      corporateName: row.credential ? row.credential.name : null,
      credential: undefined,
    })),
  };
});

/**
 * Admin: update onboarding status by record id.
 */
exports.updateOnboardingStatusByAdmin = asyncHandler(async ({ id, status }) => {
  const record = await paymentLinkOnboarding.findOne({ where: { id } });
  if (!record) {
    const err = new Error('Onboarding record not found');
    err.statusCode = 404;
    throw err;
  }
  const updates = { status };
  if (status === 'active' && !record.activatedAt) {
    updates.activatedAt = new Date();
  }
  await record.update(updates);
  return record.get({ plain: true });
});
