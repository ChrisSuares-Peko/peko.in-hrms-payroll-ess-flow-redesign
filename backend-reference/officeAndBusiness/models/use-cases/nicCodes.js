const NicCode = require("../../models/entities/nicCodes");

const getNicList = async ({ parent }) => {
  const where = parent
    ? { parent_code: parent }
    : { parent_code: null };

  const data = await NicCode.findAll({
    where,
    attributes: ["code", "description", "level"],
    order: [["code", "ASC"]],
  });

  return data;
};

module.exports = getNicList;