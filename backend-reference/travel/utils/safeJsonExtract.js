const { literal } = require("sequelize");

const safeJsonExtract = (column, path) => {
  return literal(`
    CASE
      WHEN JSON_VALID(${column})
      THEN JSON_UNQUOTE(JSON_EXTRACT(${column}, '${path}'))
      ELSE NULL
    END
  `);
};

module.exports = { safeJsonExtract };
