const EnachMandate = require("../entities/eNachMandate");
const { Op } = require("sequelize");

async function addEnachMandate(params) {
  const mandateObj = {
    customer_name: params.customer_name,
    customer_phone: params.customer_phone,
    customer_email: params.customer_email,
    account_number: params.account_number,
    account_type: params.account_type,
    bank_code: params.bank_code,
    authentication_mode: params.authentication_mode,
    amount: params.amount,
    frequency: params.frequency,
    start_date: params.start_date,
    end_date: params.end_date,
    amount_rule: params.amount_rule,
    category_code: params.category_code,
    reference_id: params.reference_id,
    decentro_txn_id: params.decentro_txn_id,
    decentro_mandate_id: params.decentro_mandate_id,
    status: params.status,
    uistreams: params.uistreams,
    corporateUser: params.corporateUser,
    mandate_link: params.mandate_link,
  };

  Object.keys(mandateObj).forEach((key) => {
    if (mandateObj[key] === undefined) {
      delete mandateObj[key];
    }
  });

  return await EnachMandate.create(mandateObj);
}

async function findEnachMandateByReferenceId(reference_id) {
  return await EnachMandate.findOne({
    where: { reference_id },
    raw: true,
  });
}

async function updateEnachMandateByReferenceId(reference_id, updates) {
  const [updatedCount] = await EnachMandate.update(updates, {
    where: { reference_id },
  });
  return updatedCount;
}

async function findAllEnachMandates({ corporateUser, limit = 10, page = 0, status, search }) {
  const whereClause = { corporateUser };

  if (status) {
    whereClause.status = String(status).toUpperCase();
  }

  if (search) {
    whereClause[Op.or] = [
      { reference_id: { [Op.like]: `%${search}%` } },
      { customer_name: { [Op.like]: `%${search}%` } },
      { customer_phone: { [Op.like]: `%${search}%` } },
      { customer_email: { [Op.like]: `%${search}%` } },
      { decentro_txn_id: { [Op.like]: `%${search}%` } },
    ];
  }

  return await EnachMandate.findAndCountAll({
    where: whereClause,
    limit,
    offset: page * limit,
    order: [["createdAt", "DESC"]],
    raw: true,
  });
}

module.exports = {
  addEnachMandate,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
  findAllEnachMandates,
};
