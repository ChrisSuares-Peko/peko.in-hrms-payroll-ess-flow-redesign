const { Op, literal } = require("sequelize");
const billerMDM = require("../entities/billerMDM");

/**
 * Upsert biller metadata. Does NOT touch the `data` field on existing records
 * so MDM API data is preserved across meta updates.
 */
async function upsertBillersMeta(billers) {
  await Promise.all(
    billers.map((biller) =>
      billerMDM.upsert({
        billerId: biller.billerId,
        billerName: biller.billerName || null,
        billerCategory: biller.billerCategory || null,
        billerCoverage: biller.billerCoverage || null,
        status: biller.status || 'active',
      })
    )
  );
}

async function upsertBillerData(billerId, data) {
  // billerName is admin-editable. On insert we seed it from MDM; on subsequent refreshes
  // we DO NOT touch the column — admin's overrides survive. The raw MDM name is always
  // available in data.billerName for change detection on the listing page.
  const existing = await billerMDM.findOne({ where: { billerId } });

  if (existing) {
    const updateFields = { data };
    if (data.billerCategory != null) updateFields.billerCategory = data.billerCategory;
    if (data.billerCoverage != null) updateFields.billerCoverage = data.billerCoverage;
    await existing.update(updateFields);
    return;
  }

  await billerMDM.create({
    billerId,
    data,
    billerName: data.billerName || null,
    billerCategory: data.billerCategory || null,
    billerCoverage: data.billerCoverage || null,
  });
}

async function updateBillerName(billerId, billerName) {
  const [affected] = await billerMDM.update(
    { billerName: billerName == null ? null : String(billerName).trim() },
    { where: { billerId } }
  );
  return affected > 0;
}

async function findRecordByBillerId(billerId) {
  return billerMDM.findOne({ where: { billerId } });
}

async function findAllActive() {
  return billerMDM.findAll({ where: { status: 'active' } });
}

async function findAllDisabled() {
  return billerMDM.findAll({ where: { status: 'disabled' } });
}

async function findAll() {
  return billerMDM.findAll();
}

async function updateStatus(billerIds, status) {
  await billerMDM.update({ status }, { where: { billerId: { [Op.in]: billerIds } } });
}

async function removeBillersByIds(billerIds) {
  await billerMDM.destroy({ where: { billerId: { [Op.in]: billerIds } } });
}

async function countAll() {
  return billerMDM.count();
}

async function findByCategory(category) {
  if (!category || category.toLowerCase() === 'all') {
    return billerMDM.findAll();
  }
  return billerMDM.findAll({ where: { billerCategory: category } });
}

async function findByBillerIds(billerIds) {
  return billerMDM.findAll({ where: { billerId: { [Op.in]: billerIds } } });
}

async function findFirst100() {
  return billerMDM.findAll({ limit: 100 });
}

/**
 * Returns billerIds sorted: never-fetched first, then empty/null data, then oldest updatedAt.
 */
async function findStaleFirst(billerIds) {
  const records = await billerMDM.findAll({
    where: { billerId: { [Op.in]: billerIds } },
    attributes: ['billerId', 'data', 'updatedAt'],
    order: [
      [literal("CASE WHEN data = '{}' OR data IS NULL THEN 0 ELSE 1 END"), 'ASC'],
      ['updatedAt', 'ASC'],
    ],
  });

  const recordedIds = new Set(records.map(r => r.billerId));
  const neverFetched = billerIds.filter(id => !recordedIds.has(id));
  return [...neverFetched, ...records.map(r => r.billerId)];
}

async function getLastUpdated() {
  const record = await billerMDM.findOne({
    attributes: ['updatedAt'],
    order: [['updatedAt', 'DESC']],
  });
  return record ? record.updatedAt : null;
}

async function getCategories() {
  const records = await billerMDM.findAll({
    attributes: ["billerCategory"],
    group: ["billerCategory"],
    where: { billerCategory: { [Op.ne]: null } },
  });
  return records.map((r) => r.billerCategory);
}

const ALLOWED_SORT_FIELDS = {
  billerId: 'billerId',
  billerName: 'billerName',
  billerCategory: 'billerCategory',
  billerCoverage: 'billerCoverage',
  status: 'status',
  mdmUpdatedAt: 'updatedAt',
};

/**
 * Server-side paginated, sorted, filtered query.
 */
async function findPaginated({ page = 1, pageSize = 10, sortField, sortOrder, status, category, search, hasMDMData } = {}) {
  const offset = (Math.max(1, page) - 1) * pageSize;
  const andConditions = [];

  if (status) andConditions.push({ status });
  if (category) andConditions.push({ billerCategory: category });

  if (search && search.trim()) {
    andConditions.push({
      [Op.or]: [
        { billerId: { [Op.like]: `%${search.trim()}%` } },
        { billerName: { [Op.like]: `%${search.trim()}%` } },
        { billerCategory: { [Op.like]: `%${search.trim()}%` } },
        { billerCoverage: { [Op.like]: `%${search.trim()}%` } },
      ],
    });
  }

  if (hasMDMData === 'true') {
    andConditions.push(literal("JSON_LENGTH(data) > 0"));
  } else if (hasMDMData === 'false') {
    andConditions.push(literal("JSON_LENGTH(data) = 0"));
  }

  const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};
  const orderField = ALLOWED_SORT_FIELDS[sortField] || 'billerId';
  const orderDir = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return billerMDM.findAndCountAll({
    where,
    limit: Math.min(pageSize, 500),
    offset,
    order: [[orderField, orderDir]],
  });
}

async function countByStatus(status) {
  return billerMDM.count({ where: { status } });
}

module.exports = {
  upsertBillersMeta,
  upsertBillerData,
  updateBillerName,
  findRecordByBillerId,
  findAllActive,
  findAllDisabled,
  findAll,
  updateStatus,
  removeBillersByIds,
  countAll,
  countByStatus,
  findByCategory,
  findByBillerIds,
  findFirst100,
  findStaleFirst,
  findPaginated,
  getLastUpdated,
  getCategories,
};
