const category = require("../models/entities/categories");
const credential = require("../models/entities/credential");
const orders = require("../models/entities/order");
const cloud_employees = require("../models/entities/pekoCloud/cloud_employees");
const plans = require("../models/entities/plans");
const serviceOperators = require("../models/entities/serviceOperator");
const transaction = require("../models/entities/transaction");
const vendors = require("../models/entities/vendor");
 const works = require("../models/entities/works");

let models = {
  order: orders,
  serviceOperator: serviceOperators,
  vendor: vendors,
  credential: credential,
  transaction: transaction,
   work: works,
  category: category,
  plan: plans,
  cloud_employee: cloud_employees,
};

exports.handleSortFields = (sortField="createdAt", sort="DESC") => {
  if (sortField.includes(".")) {
    const fields = sortField.split(".");
    if (fields.length === 2) {
      return [
        [
          {
            model: models[fields[0]],
            as: fields[0],
          },
          fields[1],
          sort,
        ],
      ];
    } else if (fields.length === 3) {
      return [
        [
          {
            model: models[fields[0]],
            as: fields[0],
          },
          {
            model: models[fields[1]],
            as: fields[1],
          },
          fields[2],
          sort,
        ],
      ];
    }
  } else {
    return [[sortField, sort]];
  }
};
