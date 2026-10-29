const Joi = require("joi");
const { customLog } = require('./loggerHelper');

exports.validateApiResponse = (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.array().items(Joi.string().email()).optional().messages({
                "array.base": "Email must be an array.",
                "string.email": "Each email must be a valid email address.",
                "any.required": "Email is required.",
            }),
            isActive: Joi.boolean().optional().messages({
                "boolean.base": "isActive must be a boolean.",
                "any.required": "isActive is required.",
            }),
            scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
                "string.base": "Scheduled time must be a string.",
                "string.pattern.base": "Scheduled time must be in HH:mm format.",
                "any.required": "Scheduled time is required.",
            }),
            scheduledDay: Joi.alternatives().try(Joi.string(), Joi.boolean()).optional().messages({
                "alternatives.match": "Scheduled day must be either a string or a boolean.",
                "any.required": "Scheduled day is required.",
            }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                status: false,
                message: result.error.details[0].message,
            });
        }
        next();
    } catch (err) {
        customLog(null, "error", { error: err, message: "Validation error in validateApiResponse" });
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
        });
    }
};

exports.validateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            isActive: Joi.boolean().required().messages({
                "boolean.base": "isActive must be a boolean.",
                "any.required": "isActive is required.",
            })
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                status: false,
                message: result.error.details[0].message,
            });
        }
        next();
    } catch (err) {
        customLog(null, "error", { error: err, message: "Validation error in validateStatus" });
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
        });
    }
};

