const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { getCurrentFolderSize } = require('../../../utils/s3');
const { findMaximumUsageLimit } = require('../../../models/use-cases/subscription');
const { NODE_ENV } = process.env;

// const LIMIT_BYTES = 1073741824; // 1 GB limit, adjust as needed
// const LIMIT_GB = 1; // 1 GB limit, adjust as needed

exports.getCloudUsage = asyncHandler(async (req, res, next) => {
    const { user } = req

    if (!user?.role || !user?.username) {
        return next(new ErrorResponse(`Something went wrong while fetching storage`, 500));
    }

    const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/corporate/${user?.username}/peko-cloud`
    const usedStorageInBytes = await getCurrentFolderSize(filePath);
    
    const usedStorageInGB = usedStorageInBytes / (1024 * 1024 * 1024);
    const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: 'pekoCloud' })

    return res.status(200).json({
        'status': true,
        'data': {
            storageUsedInGB: usedStorageInGB,
            storageUsedInBytes: usedStorageInBytes,
            storageAvailable: maximumStorageAccess,
        },
        'message': 'Fetched storage details successfully',
        'responseCode': '000'
    });
});

