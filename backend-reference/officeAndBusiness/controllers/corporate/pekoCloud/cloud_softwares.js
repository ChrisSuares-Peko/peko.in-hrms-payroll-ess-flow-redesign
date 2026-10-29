const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { findSoftwaresList } = require('../../../models/use-cases/pekoCloud/cloud_softwares');

exports.findSoftwaresList = asyncHandler(async (req, res, next) => {
    const result = await findSoftwaresList();
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching softwares`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched softwares successfully',
        'responseCode': '000'
    });
});

