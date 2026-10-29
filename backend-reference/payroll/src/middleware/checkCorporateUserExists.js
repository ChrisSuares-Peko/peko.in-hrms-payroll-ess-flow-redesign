const CorporateUser = require('../models/entities/corporateUser');
const ErrorResponse = require('../utils/error-response');

const getCorporateUser = async (req, res, next) => {
    try {
        const corporateUserID = req.params.corporateId;
        if (!corporateUserID) {
            throw new ErrorResponse('Missing corporateUser query parameter', 404);
        }

        const user = await CorporateUser.findById(corporateUserID);
        if (!user || user == null) {
            throw new ErrorResponse('User not found please create corporate user', 404);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = getCorporateUser;
