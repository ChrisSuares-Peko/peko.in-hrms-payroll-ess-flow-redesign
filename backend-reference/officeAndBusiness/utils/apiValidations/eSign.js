/* eslint-disable no-unused-vars */
const Joi = require('joi');

exports.validateResendInvitation = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required().messages({
                'any.required': 'Signer name is required.',
                'string.empty': 'Signer name cannot be empty.'
            }),
            email: Joi.string().email().required().messages({
                'any.required': 'Signer email is required.',
                'string.email': 'Signer email must be a valid email.',
                'string.empty': 'Signer email cannot be empty.'
            }),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateESignPositions = (req, res, next) => {
    try {
        const { signers_info } = req.body
        const store = {}
        const allStore = {}
        const errorMsg = 'Please select different signature positions for recipients.'
        for (let i = 0; i < signers_info.length; i++) {
            const { page_number, signer_position } = signers_info[i];
            for (let k = 0; k < page_number.length; k++) {
                const pageNumber = page_number[k];
                for (let j = 0; j < signer_position.length; j++) {
                    const position = signer_position[j];
                    if (pageNumber == 'all') {
                        if (allStore[position]) {
                            throw new Error(errorMsg);
                        }
                        allStore[position] = true
                        for (const [key, value] of Object.entries(store)) {
                            const [pageNumber2, position2] = key.split('_');
                            if (position2 === position) {
                                throw new Error(errorMsg);
                            }
                        }
                    } else {
                        let key = `${pageNumber}_${position}`
                        if (allStore[position]) {
                            throw new Error(errorMsg);
                        }
                        if (store[key]) {
                            throw new Error(errorMsg);
                        }
                        store[key] = true
                    }
                }
            }
        }
        next();
    } catch (err) {
        next(err);
    }
};