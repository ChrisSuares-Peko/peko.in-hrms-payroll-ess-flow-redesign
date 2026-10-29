
const credential = require("../models/entities/credential");
const orders = require("../models/entities/order");


const serviceOperators = require("../models/entities/serviceOperator");
const transaction = require("../models/entities/transaction");
const vendors = require("../models/entities/vendor");


let models = {
  order: orders,
  serviceOperator: serviceOperators,
  vendor: vendors,
  credential: credential,
  transaction: transaction,
 
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
