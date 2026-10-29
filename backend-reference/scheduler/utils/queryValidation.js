const Joi = require("joi");

exports.getPreRemindersValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};
