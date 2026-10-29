const asyncHandler = require('../../middlewares/async')

const { findTransactionsByBatchId } = require('../../models/use-cases/transaction')
const {  getValue } = require("../../utils/cacheDataMethods");

exports.getBulkPaymentStatus = asyncHandler(async (req, res) => {
    let batchId = req.params?.batchId
    // F-PAY-13: scope to the caller so another tenant's batch status can't be read.
    const credentialId = req.user.id

    let bulkPaymentStatus = await findTransactionsByBatchId(batchId, credentialId)

    return res.status(200).json({
        status: true,
        message: "Status Fetched Successfully",
        responseCode: '000',
        data: { bulkPaymentStatus }
    })

})

exports.getBulkPaymentData = asyncHandler(async (req, res) => {
    const batchId = req.params?.esimStoredBatchId.replace(/^"|"$/g, '');
    const redisKey = `${batchId}`;
    const bulkPaymentDataString = await getValue(redisKey);
    if (!bulkPaymentDataString) {
        return res.status(404).json({
            status: false,
            message: "Data not found in Redis",
            responseCode: '404',
        });
    }

    return res.status(200).json({
        status: true,
        message: "Status Fetched Successfully",
        responseCode: '000',
        data: JSON.parse(bulkPaymentDataString),
    });
});