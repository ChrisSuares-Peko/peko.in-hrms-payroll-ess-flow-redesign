const { feTransactionStatus, FE_STATUS_FILTERS, FE_TRANSACTION_STATUS } = require('../jit')

describe('feTransactionStatus', () => {
    it('maps any DECLINED authorization to "Declined" regardless of internal status', () => {
        expect(feTransactionStatus('DECLINED', 'AUTH_RECEIVED')).toBe('Declined')
        expect(feTransactionStatus('DECLINED', 'NOTIFIED')).toBe('Declined')
    })

    it('maps a REVERSED transaction to "Reversed", even though its decision is DECLINED', () => {
        expect(feTransactionStatus('DECLINED', 'REVERSED')).toBe('Reversed')
    })

    it('maps a REFUNDED transaction to "Refunded", even though its decision stays AUTHORIZED', () => {
        expect(feTransactionStatus('AUTHORIZED', 'REFUNDED')).toBe('Refunded')
    })

    it('maps an AUTHORIZED + NOTIFIED transaction to "Completed"', () => {
        expect(feTransactionStatus('AUTHORIZED', 'NOTIFIED')).toBe('Completed')
    })

    it('maps an AUTHORIZED transaction still awaiting NOTIFY to "Processing"', () => {
        expect(feTransactionStatus('AUTHORIZED', 'AUTH_RECEIVED')).toBe('Processing')
        expect(feTransactionStatus('AUTHORIZED', undefined)).toBe('Processing')
    })
})

describe('FE_STATUS_FILTERS', () => {
    it('is the reverse mapping of the FE status word back to (decision, status) columns', () => {
        expect(FE_STATUS_FILTERS[FE_TRANSACTION_STATUS.DECLINED]).toEqual({ decision: 'DECLINED', status: 'AUTH_RECEIVED' })
        expect(FE_STATUS_FILTERS[FE_TRANSACTION_STATUS.PROCESSING]).toEqual({ decision: 'AUTHORIZED', status: 'AUTH_RECEIVED' })
        expect(FE_STATUS_FILTERS[FE_TRANSACTION_STATUS.COMPLETED]).toEqual({ decision: 'AUTHORIZED', status: 'NOTIFIED' })
        expect(FE_STATUS_FILTERS[FE_TRANSACTION_STATUS.REVERSED]).toEqual({ decision: 'DECLINED', status: 'REVERSED' })
        expect(FE_STATUS_FILTERS[FE_TRANSACTION_STATUS.REFUNDED]).toEqual({ decision: 'AUTHORIZED', status: 'REFUNDED' })
    })
})
