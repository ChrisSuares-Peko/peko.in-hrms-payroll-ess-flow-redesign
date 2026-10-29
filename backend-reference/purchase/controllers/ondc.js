const asyncHandler = require('../middlewares/async')
const { customLog } = require('../utils/loggerHelper')

exports.search = asyncHandler(async (req, res) => {
    customLog(req.LogTraceId, 'info', { body: req.body, message: 'ONDC /search received' }, 'ONDC')

    const ctx = req.body?.context
    if (!ctx?.transaction_id || !ctx?.bap_uri || !ctx?.message_id) {
        return res.status(200).json({
            message: { ack: { status: 'NACK' } },
            error: { type: 'DOMAIN-ERROR', code: '20000', message: 'Missing mandatory context fields' }
        })
    }

    return res.status(200).json({ message: { ack: { status: 'ACK' } } })
})

exports.onSearch = asyncHandler(async (req, res) => {
    customLog(req.LogTraceId, 'info', { body: req.body, message: 'ONDC /on_search received' }, 'ONDC')

    return res.status(200).json({ message: { ack: { status: 'ACK' } } })
})
