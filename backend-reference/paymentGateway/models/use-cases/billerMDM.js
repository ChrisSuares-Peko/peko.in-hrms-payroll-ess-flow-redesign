const { Op, literal } = require("sequelize");
const billerMDM = require("../entities/billerMDM");

/**
 * Upsert API data for billers — only updates the `data` field to avoid overwriting Excel meta.
 */
async function upsertBillers(billers) {
  await Promise.all(
    billers.map((biller) =>
      billerMDM.upsert({ billerId: biller.billerId, data: biller })
    )
  );
}

/**
 * Upsert biller metadata from Excel upload (name, category, coverage).
 * Sets data to {} as placeholder until API fetch populates it.
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

async function findByBillerId(billerId) {
  const record = await billerMDM.findOne({ where: { billerId } });
  return record ? record.data : null;
}

/**
 * Returns the full billerMDM record (including category, status, etc.)
 */
async function findRecordByBillerId(billerId) {
  return billerMDM.findOne({ where: { billerId } });
}

/**
 * Returns all records matching a billerCategory.
 */
async function findByBillerCategory(category) {
  return billerMDM.findAll({ where: { billerCategory: category, status: 'active' } });
}

async function findByCategory(category) {
  return billerMDM.findAll({ where: { billerCategory: category } });
}

async function findByBillerIds(billerIds) {
  return billerMDM.findAll({ where: { billerId: { [Op.in]: billerIds } } });
}

async function findFirst100() {
  return billerMDM.findAll({ limit: 100 });
}

/**
 * Returns billerIds from the provided list, sorted by:
 * 1. Records with empty data ({}) or no record (never fetched) — first
 * 2. Then by updatedAt ASC (oldest first)
 * Used for refresh optimization.
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
  // billerIds with no record at all go first
  const neverFetched = billerIds.filter(id => !recordedIds.has(id));
  const sorted = records.map(r => r.billerId);
  return [...neverFetched, ...sorted];
}

async function getLatestUpdatedAt() {
  const record = await billerMDM.findOne({ order: [["updatedAt", "DESC"]] });
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

module.exports = {
  upsertBillers,
  upsertBillersMeta,
  findByBillerId,
  findRecordByBillerId,
  findByBillerCategory,
  findByCategory,
  findByBillerIds,
  findFirst100,
  findStaleFirst,
  getLatestUpdatedAt,
  getCategories,
};
