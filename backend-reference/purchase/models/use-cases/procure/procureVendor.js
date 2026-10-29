const ProcureVendor = require('../../entities/ProcureVendor');
const PurchaseOrder = require('../../entities/PurchaseOrder');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

exports.listAllVendors = async ({ corporateUserId, status, search, hasPayoutBeneficiary }) => {
  const where = { corporateUserId };

  if (status) where.status = status;
  if (hasPayoutBeneficiary) where.payoutBeneficiaryId = { [Op.ne]: null };

  if (search) {
    where[Op.or] = [
      { businessName: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  return ProcureVendor.findAll({
    where,
    attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone', 'status', 'bankName', 'accountNumber', 'ifscCode', 'paymentTerms', 'tags', 'payoutBeneficiaryId'],
    order: [['businessName', 'ASC']],
    raw: true,
  });
};

exports.listVendors = async (params) => {
  const {
    corporateUserId,
    status,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  } = params;

  const offset = (page - 1) * limit;

  const where = { corporateUserId };

  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { businessName: { [Op.like]: `%${search}%` } },
      { tradeLicenseNo: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
      { status: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const result = await ProcureVendor.findAndCountAll({
    where,
    include: [
      {
        model: PurchaseOrder,
        as: 'purchaseOrders',
        attributes: [],
        required: false,
      },
    ],
    attributes: [
      'id',
      'tradeLicenseNo',
      'businessName',
      'contactPerson',
      'email',
      'phone',
      'tags',
      'paymentTerms',
      'status',
      'createdAt',
      'updatedAt',
      [Sequelize.fn('COUNT', Sequelize.col('purchaseOrders.id')), 'poCount'],
      [Sequelize.literal(`COALESCE(SUM(CASE WHEN \`purchaseOrders\`.\`status\` NOT IN ('Draft') THEN \`purchaseOrders\`.\`totalAmount\` ELSE 0 END), 0)`), 'totalSpend'],
      [Sequelize.fn('MAX', Sequelize.col('purchaseOrders.updatedAt')), 'lastActivity'],
    ],
    group: ['procureVendor.id'],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    subQuery: false,
  });

  return {
    rows: result.rows,
    count: result.count.length,
  };
};

exports.createVendor = async (fields) => {
  return ProcureVendor.create(fields);
};

exports.findDuplicateVendor = async ({ corporateUserId, accountNumber, ifscCode, upiId, excludeId }) => {
  const where = { corporateUserId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (upiId) {
    where.upiId = upiId;
  } else {
    where.accountNumber = accountNumber;
    where.ifscCode = ifscCode;
  }
  return ProcureVendor.findOne({ where });
};

exports.findVendorById = async ({ id, corporateUserId }) => {
  return ProcureVendor.findOne({ where: { id, corporateUserId } });
};

exports.findVendorByEmail = async ({ email, corporateUserId }) => {
  return ProcureVendor.findOne({ where: { email: email.toLowerCase(), corporateUserId } });
};

exports.findVendorByGstin = async ({ gstin, corporateUserId, excludeId }) => {
  const where = { gstin, corporateUserId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return ProcureVendor.findOne({ where });
};

exports.countPurchaseOrders = async (vendorId) => {
  return PurchaseOrder.count({ where: { vendorId } });
};

exports.updateVendor = async (vendor, fields) => {
  return vendor.update(fields);
};

exports.bulkCreateVendors = async (vendors) => {
  return ProcureVendor.bulkCreate(vendors, { validate: true });
};

exports.destroyVendor = async (vendor) => {
  return vendor.destroy();
};
