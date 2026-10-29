const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const CoaRules = require("../entities/coaRules");
const { Op } = require("sequelize");
const sequelize = require('./../../configs/database/index');

exports.createCoaRules = async (data) => {
  const transaction = await sequelize.transaction();
  try {
    const { entityType, prefix } = data;

    const existingRule = await CoaRules.findOne({
      where: { entityType, prefix },
      transaction,
    });

    if (existingRule) {
      throw new Error(`A rule already exists for entity '${entityType}' with prefix '${prefix}'.`);
    }

    const newRule = await CoaRules.create(
      {
        ...data,
        isActive: true,
      },
      { transaction }
    );

    await transaction.commit();
    return newRule;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.updateCoaRules = async (id, updateData) => {
  const rule = await CoaRules.findByPk(id);
  if (!rule) {
    throw new Error("COA Rule not found");
  }

  await rule.update(updateData, { fields: Object.keys(updateData) });
  return rule;
};

exports.setActiveCoaRule = async (id, status) => {
  const rule = await CoaRules.findByPk(id);
  if (!rule) {
    throw new Error("COA Rule not found");
  }

  await rule.update({ isActive: status });
  return rule;
};

exports.getAllCoaRules = asyncHandler(async (params, attributes = undefined) => {
  const { limit, offset, searchText, sort, sortField } = params;
  let order = handleSortFields(sortField, sort);

  const where = {};
  if (searchText) {
    where[Op.or] = [
      { entityType:      { [Op.like]: `%${searchText}%` } },
      { prefix:          { [Op.like]: `%${searchText}%` } },
      { accountType:     { [Op.like]: `%${searchText}%` } },
      { parentAccountId: { [Op.like]: `%${searchText}%` } },
      { description:     { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await CoaRules.findAndCountAll({
    where,
    limit,
    offset,
    order,
    attributes,
    raw: true,
  });
});

exports.getCoaRuleById = async (id) => {
  return await CoaRules.findByPk(id);
};

exports.deleteCoaRules = async (id) => {
  const rule = await CoaRules.findByPk(id);
  if (!rule) {
    throw new Error("COA Rule not found");
  }

  await rule.destroy();
  return true;
};

exports.getActiveRuleByEntityType = async (entityType) => {
  return await CoaRules.findAll({
    where: { entityType, isActive: true },
  });
};
