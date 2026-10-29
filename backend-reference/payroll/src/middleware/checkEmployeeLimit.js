const axios = require('axios');
const { getEmployeeCountByCorporateUser } = require('../models/use-cases/employee');
const ErrorResponse = require('../utils/error-response');
const accessKey = 'peko_payroll';

const validateSubscriptionLimit = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { count } = await getEmployeeCountByCorporateUser(userId);

        if (!Number.isFinite(count)) {
            return next(new ErrorResponse(`Something went wrong while adding employee`, 400));
        }
        let serverBaseUrl = process.env.SERVER_URL
        if (process.env.NODE_ENV == 'staging') {
            serverBaseUrl = process.env.STAGING_URL
        } 
        else{
            serverBaseUrl = process.env.PRODUCTION_URL
        }
        const response = await axios.get(`${serverBaseUrl}/api/v1/user/subscription/add-ons`, {
            headers: {
                'sessionid': req.headers.sessionid,
                'Authorization': req.headers.authorization
            },
            params: {
                accessKey: accessKey
            }
        });

        const maxEmployeeLimit = response.data.data.maxLimit

         // Check employee limit based on request type (bulk upload or single)
         if (req.body.jsonData) { 
            // Bulk upload case
            const numNewEmployees = req.body.jsonData.length;
            if (count + numNewEmployees <= maxEmployeeLimit) {
                next();
            } else {
                const availableLimit = maxEmployeeLimit - count;
                throw new ErrorResponse(`Your employee limit has been reached. The current available limit is ${availableLimit}. To continue, please consider upgrading your plan.`, 401);
            }
        } else { 
            // Single employee case
            if (count < maxEmployeeLimit) {
                next();
            } else {
                throw new ErrorResponse('Your employee limit has been reached. To continue, please consider upgrading your plan.', 401);
            }
        }
    } catch (error) {
        next(error);
    }
};

module.exports = validateSubscriptionLimit;
