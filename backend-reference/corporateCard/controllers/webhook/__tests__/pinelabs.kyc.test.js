const { upsertByMobileIfNewer } = require('../../../models/use-cases/cardholderKyc')
const { recordNotify, recordRefund, findByTransactionUniqueId } = require('../../../models/use-cases/cardTransaction')
const { kyc, callback } = require('../pinelabs')
const { KYC_STATUS } = require('../../../constants/kyc')

jest.mock('../../../models/use-cases/cardholderKyc', () => ({
    upsertByMobileIfNewer: jest.fn(),
}))

jest.mock('../../../models/use-cases/cardTransaction', () => ({
    recordAuth: jest.fn(),
    recordNotify: jest.fn(),
    recordRefund: jest.fn(),
    findByTransactionUniqueId: jest.fn(),
    getAuthorizedSpendForCard: jest.fn(),
    getAuthorizedSpendTotal: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const ACCEPTED_BODY = {
    mobileNumber: '9999999999',
    kycType: 3,
    status: 0,
    reason: null,
    updatedOn: '2026-07-02T10:00:00Z',
    additionalInfo: { customerSignature: 'sig-123' },
}

const REJECTED_BODY = { ...ACCEPTED_BODY, status: 1, reason: 'Document mismatch' }

beforeEach(() => {
    jest.clearAllMocks()
    recordNotify.mockResolvedValue({})
    findByTransactionUniqueId.mockResolvedValue({ id: 62, transactionUniqueId: 14928135070, corporateId: 42 })
    recordRefund.mockResolvedValue({ id: 63 })
})

describe('exports.kyc', () => {
    it('acknowledges with 200 without persisting when mobileNumber is missing', async () => {
        const req = { body: { ...ACCEPTED_BODY, mobileNumber: undefined }, headers: {} }
        const res = buildRes()

        await kyc(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(upsertByMobileIfNewer).not.toHaveBeenCalled()
    })

    it('acknowledges with 200 without persisting when status is not a recognized value', async () => {
        const req = { body: { ...ACCEPTED_BODY, status: 99 }, headers: {} }
        const res = buildRes()

        await kyc(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(upsertByMobileIfNewer).not.toHaveBeenCalled()
    })

    it('persists COMPLETED status and strips kycDetail before storage on Accepted (status 0)', async () => {
        upsertByMobileIfNewer.mockResolvedValue({ applied: true })
        const req = { body: { ...ACCEPTED_BODY, kycDetail: { aadhaar: '1234-5678-9012' } }, headers: {} }
        const res = buildRes()

        await kyc(req, res)

        expect(upsertByMobileIfNewer).toHaveBeenCalledWith('9999999999', expect.objectContaining({
            kycStatus: KYC_STATUS.COMPLETED,
            lastEventAt: ACCEPTED_BODY.updatedOn,
            customerSignature: 'sig-123',
        }))
        const [, fields] = upsertByMobileIfNewer.mock.calls[0]
        expect(fields.rawResponse.kycDetail).toBeUndefined()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('persists REJECTED status on Rejected (status 1)', async () => {
        upsertByMobileIfNewer.mockResolvedValue({ applied: true })
        const req = { body: REJECTED_BODY, headers: {} }
        const res = buildRes()

        await kyc(req, res)

        expect(upsertByMobileIfNewer).toHaveBeenCalledWith('9999999999', expect.objectContaining({
            kycStatus: KYC_STATUS.REJECTED,
            reason: 'Document mismatch',
        }))
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('still returns 200 when the event was ignored as stale', async () => {
        upsertByMobileIfNewer.mockResolvedValue({ applied: false })
        const req = { body: ACCEPTED_BODY, headers: {} }
        const res = buildRes()

        await kyc(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
    })
})

describe('exports.callback', () => {
    it('processes a flat JIT NOTIFY and records it', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 2, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).toHaveBeenCalledWith(14928135070, expect.objectContaining({
            notificationUniqueId: 170149281355,
            transactionAmount: 10,
        }))
        expect(res.status).toHaveBeenCalledWith(200)
        expect(upsertByMobileIfNewer).not.toHaveBeenCalled()
    })

    it('marks a reversal NOTIFY (transactionType 18) DECLINED with the mapped reasonCode', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 18, transactionAmount: 10, reasonCode: 2 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).toHaveBeenCalledWith(14928135070, expect.objectContaining({
            decision: 'DECLINED',
            status: 'REVERSED',
            declineReason: 'Reversed — insufficient funds',
        }))
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('detects a reversal from a genuine reasonCode alone, even when the outer transactionType is an unrecognized value', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 99, transactionAmount: 10, reasonCode: 3 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).toHaveBeenCalledWith(14928135070, expect.objectContaining({
            decision: 'DECLINED',
            status: 'REVERSED',
            declineReason: 'Reversed — timeout',
        }))
    })

    it('marks a refund NOTIFY (transactionType 23) as a new, linked REFUND row — never updating the original via recordNotify', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 23, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(findByTransactionUniqueId).toHaveBeenCalledWith(14928135070)
        expect(recordRefund).toHaveBeenCalledWith(expect.objectContaining({
            parent: expect.objectContaining({ id: 62 }),
            notificationUniqueId: 170149281355,
            transactionAmount: 10,
            transactionType: 23,
        }))
        expect(recordNotify).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('treats transactionType 23 as a refund even when reasonCode is also present, never as a reversal', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 23, transactionAmount: 10, reasonCode: 2 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordRefund).toHaveBeenCalled()
        expect(recordNotify).not.toHaveBeenCalled()
    })

    it('acknowledges a refund NOTIFY for an unknown transactionUniqueId without creating a refund row', async () => {
        findByTransactionUniqueId.mockResolvedValue(null)
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 23, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordRefund).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    // Same transactionUniqueId can arrive across multiple NOTIFYs with a different transactionType each
    // time (debit settles as 2, then a later NOTIFY refunds it as 23) — the stored type must track the
    // latest one, not freeze at whatever AUTH first saw.
    it('updates the stored transactionType on every NOTIFY to the latest value received', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 2, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).toHaveBeenCalledWith(14928135070, expect.objectContaining({ transactionType: 2 }))
    })

    // Confirmed against production traffic (2026-08-29): Pine Labs sends reasonCode: 0 on every NOTIFY,
    // reversal or not — a plain successful DEBIT arrived with transactionType 2 and reasonCode 0, and was
    // incorrectly marked REVERSED before this was caught. reasonCode 0 must never trigger reversal alone.
    it('does not treat reasonCode 0 as a reversal signal, even with an unrecognized transactionType', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 99, transactionAmount: 10, reasonCode: 0 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        const [, fields] = recordNotify.mock.calls[0]
        expect(fields).not.toHaveProperty('decision')
        expect(fields).not.toHaveProperty('status')
        expect(fields).not.toHaveProperty('declineReason')
    })

    // The exact production payload that surfaced the bug: a routine successful debit (transactionType 2,
    // notes.ppTxnType 2, "Transaction successful.") that also carries reasonCode: 0.
    it('does not reverse a real successful-debit NOTIFY payload that happens to carry reasonCode: 0', async () => {
        const req = {
            body: {
                transactionUniqueId: 16769327970,
                notificationUniqueId: 70167693279,
                transactionDetail: {
                    transactionType: 2,
                    transactionAmount: 10,
                    reasonCode: 0,
                    message: 'Transaction successful.',
                    notes: { ppTxnType: 2, gstAmount: 0 },
                },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        const [, fields] = recordNotify.mock.calls[0]
        expect(fields).not.toHaveProperty('decision')
        expect(fields).not.toHaveProperty('status')
        expect(fields).not.toHaveProperty('declineReason')
    })

    it('treats transactionType 18 as a reversal even when reasonCode is absent, falling back to "other"', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 18, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).toHaveBeenCalledWith(14928135070, expect.objectContaining({
            decision: 'DECLINED',
            status: 'REVERSED',
            declineReason: 'Reversed — other',
        }))
    })

    it('does not touch decision/status/declineReason for a non-reversal (transactionType 2) NOTIFY', async () => {
        const req = {
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 170149281355,
                transactionDetail: { transactionType: 2, transactionAmount: 10 },
            },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        const [, fields] = recordNotify.mock.calls[0]
        expect(fields).not.toHaveProperty('decision')
        expect(fields).not.toHaveProperty('status')
        expect(fields).not.toHaveProperty('declineReason')
    })

    it('still acknowledges a NOTIFY for an unknown transactionUniqueId (recordNotify returns null)', async () => {
        recordNotify.mockResolvedValue(null)
        const req = {
            body: { transactionUniqueId: 14928135070, notificationUniqueId: 170149281355, transactionDetail: { transactionType: 2, transactionAmount: 10 } },
            headers: {},
        }
        const res = buildRes()

        await callback(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true }))
    })

    it('acknowledges with 200 without erroring when the body has no transactionUniqueId at all', async () => {
        const req = { body: {}, headers: {} }
        const res = buildRes()

        await callback(req, res)

        expect(recordNotify).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    // End-to-end sample: the same transactionUniqueId arrives twice — first NOTIFY settles it as a plain
    // debit (transactionType 2), a second, later NOTIFY reports it refunded (transactionType 23).
    // recordNotify is stubbed to actually merge fields into a persisted row, like the real DB update does,
    // so this exercises the full evolution of one row across both calls rather than two isolated ones.
    it('sample: a debit NOTIFY followed by a refund NOTIFY for the same transaction creates a separate, linked refund row', async () => {
        let row = { id: 62, transactionUniqueId: 14928135070, decision: 'AUTHORIZED', status: 'AUTH_RECEIVED', transactionType: 2 }
        recordNotify.mockImplementation((id, fields) => {
            row = { ...row, status: 'NOTIFIED', ...fields }
            return row
        })
        findByTransactionUniqueId.mockImplementation(async () => row)
        let refundRow = null
        recordRefund.mockImplementation(async ({ parent, notificationUniqueId, transactionAmount, transactionType }) => {
            refundRow = {
                id: 99,
                parentTransactionId: parent.id,
                transactionUniqueId: parent.transactionUniqueId,
                notificationUniqueId,
                transactionAmount,
                transactionType,
                decision: 'AUTHORIZED',
                status: 'REFUNDED',
            }
            return refundRow
        })

        // First NOTIFY: the debit settles normally.
        await callback({
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 1,
                transactionDetail: { transactionType: 2, transactionAmount: 478, message: 'Transaction successful.', reasonCode: 0 },
            },
            headers: {},
        }, buildRes())

        expect(row).toMatchObject({ transactionType: 2, decision: 'AUTHORIZED', transactionAmount: 478 })
        expect(row.status).not.toBe('REFUNDED')

        // Second NOTIFY, same transactionUniqueId: the merchant refunds it.
        await callback({
            body: {
                transactionUniqueId: 14928135070,
                notificationUniqueId: 2,
                transactionDetail: { transactionType: 23, transactionAmount: 478 },
            },
            headers: {},
        }, buildRes())

        // The original row is completely untouched by the refund — still the plain settled debit.
        expect(row).toMatchObject({ transactionType: 2, decision: 'AUTHORIZED', status: 'NOTIFIED', transactionAmount: 478 })
        // The refund is a brand-new row, linked back to the original by id, with its own status/type.
        expect(refundRow).toMatchObject({
            parentTransactionId: 62,
            transactionUniqueId: 14928135070,
            transactionType: 23,
            status: 'REFUNDED',
            decision: 'AUTHORIZED',
            transactionAmount: 478,
        })
    })
})
