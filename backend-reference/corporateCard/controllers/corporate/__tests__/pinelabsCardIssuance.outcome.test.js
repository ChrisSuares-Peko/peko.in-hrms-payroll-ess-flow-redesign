jest.mock('../../../utils/pinelabsGateway', () => ({
    ...jest.requireActual('../../../utils/pinelabsGateway'),
    pinelabsRequest: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    safeAudit: jest.fn(),
}))
jest.mock('../../../utils/cardOrderReconciler', () => ({
    reconcileConfig: () => ({ delayMinutes: 15, issueTimeoutMs: 5000 }),
    rememberReconcileCreds: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardholderKyc', () => ({ findByMobile: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findAndCountCardsWithHolder: jest.fn(),
    findBlockingIssuance: jest.fn(),
    createCard: jest.fn(),
    countPhysicalCardsUsed: jest.fn(),
    updateCardById: jest.fn(),
    scheduleReconcile: jest.fn(),
    replaceVirtualCardById: jest.fn(),
}))
jest.mock('../../../services/cardSlotReservation', () => {
    class CardSlotError extends Error {
        constructor(statusCode, message, quota = null) {
            super(message)
            this.statusCode = statusCode
            this.quota = quota
        }
    }
    return { CardSlotError, reservePhysicalCardSlot: jest.fn() }
})

const { pinelabsRequest } = require('../../../utils/pinelabsGateway')
const { findByMobile } = require('../../../models/use-cases/cardholderKyc')
const {
    findBlockingIssuance,
    createCard,
    updateCardById,
    scheduleReconcile,
    replaceVirtualCardById,
} = require('../../../models/use-cases/cardIssuance')
const { reservePhysicalCardSlot } = require('../../../services/cardSlotReservation')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { ACTIVE_ISSUANCE_INDEX } = require('../../../constants/cardReconcile')

const CREDS = { baseUrl: 'https://vendor', username: 'u', apiKey: 'k' }
const NEW_CARD = { id: 7, corporateId: 42, userId: 99 }

const issue = (params = {}) => issueCardCore({
    cardholder: { customerName: 'Aarav Sharma', mobile: '9876543210', email: 'a@peko.in', userId: 99, corporateId: 42, credentialId: null },
    params,
    creds: CREDS,
    cardSchemeId: 7,
    baseLimit: 10,
    unitPrice: 19,
    actor: { credentialId: 5, display: 'Admin' },
    logTraceId: 't',
})

const vendorOk = (data) => ({ ok: true, data, responseCode: data.responseCode })
const vendorHttp = (status, responseCode) => ({ ok: false, status, error: { responseCode }, noResponse: false })
const vendorTimeout = () => ({ ok: false, error: 'timeout of 5000ms exceeded', noResponse: true })

beforeEach(() => {
    jest.clearAllMocks()
    findByMobile.mockResolvedValue({ kycStatus: 'COMPLETED' })
    findBlockingIssuance.mockResolvedValue(null)
    createCard.mockResolvedValue(NEW_CARD)
    reservePhysicalCardSlot.mockImplementation(({ fields }) => createCard(fields))
    updateCardById.mockImplementation(async (id, fields) => ({ ...NEW_CARD, ...fields }))
})

const failedWrites = () => updateCardById.mock.calls.filter(([, f]) => f.status === 'FAILED')

describe('issueCardCore — outcomes that must NOT be written FAILED', () => {
    it('a DIGITAL timeout keeps the card PENDING and queues it (this exact case created duplicates)', async () => {
        pinelabsRequest.mockResolvedValue(vendorTimeout())

        const result = await issue({ cardType: 'Virtual' })

        expect(result).toEqual(expect.objectContaining({ ok: true, confirmed: false }))
        expect(failedWrites()).toHaveLength(0)
        expect(scheduleReconcile).toHaveBeenCalledWith(7, expect.objectContaining({ delaySeconds: 900 }))
    })

    it('a 409/318 keeps the card PENDING — the code PROVES an order already exists', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(409, 318))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.confirmed).toBe(false)
        expect(failedWrites()).toHaveLength(0)
    })

    it('responseCode 50 keeps the card PENDING — the vendor tells us to call order status', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(400, 50))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.confirmed).toBe(false)
        expect(failedWrites()).toHaveLength(0)
    })

    it('a PHYSICAL timeout behaves identically to a digital one', async () => {
        pinelabsRequest.mockResolvedValue(vendorTimeout())

        const result = await issue({ cardType: 'Physical', sourceCardIssuanceId: 10, sourceReferenceNumber: 111, shipping: { addressLine1: 'A1' } })

        expect(result.confirmed).toBe(false)
        expect(failedWrites()).toHaveLength(0)
        expect(replaceVirtualCardById).not.toHaveBeenCalled()
    })

    it('a 2xx responseCode 0 with NO referenceNumber is unconfirmed, never a hollow ISSUED', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({ responseCode: 0 }))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.confirmed).toBe(false)
        expect(updateCardById.mock.calls.filter(([, f]) => f.status === 'ISSUED')).toHaveLength(0)
    })

    it('an UNDOCUMENTED vendor code is unconfirmed, not failed', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(400, 4242))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.confirmed).toBe(false)
        expect(failedWrites()).toHaveLength(0)
    })
})

describe('issueCardCore — outcomes that MAY be written FAILED', () => {
    it('fails on a documented pre-order rejection, where no order can exist', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(400, 13))

        const result = await issue({ cardType: 'Virtual' })

        expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'VENDOR_FAIL' }))
        expect(failedWrites()).toHaveLength(1)
        expect(failedWrites()[0][1].reconcileNextAt).toBeNull()
    })

    // A 502 carrying the issuer's own 50002 "Bad Gateway" is treated as definitive: the card must not
    // reach the screen as Pending, and the caller gets the generic error.
    it('fails on a 502 with responseCode 50002 instead of parking the card PENDING', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(502, 50002))

        const result = await issue({ cardType: 'Virtual' })

        expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'VENDOR_FAIL', statusCode: 502 }))
        expect(failedWrites()).toHaveLength(1)
        expect(failedWrites()[0][1].reconcileNextAt).toBeNull()
        expect(scheduleReconcile).not.toHaveBeenCalled()
    })

    it('leaks no vendor wording to the caller on a 50002', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(502, 50002))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.message).not.toMatch(/bad gateway|50002/i)
    })

    it('treats a physical 50002 the same way', async () => {
        pinelabsRequest.mockResolvedValue(vendorHttp(502, 50002))

        const result = await issue({ cardType: 'Physical', sourceCardIssuanceId: 10, sourceReferenceNumber: 111, shipping: { addressLine1: 'A1' } })

        expect(result.ok).toBe(false)
        expect(failedWrites()).toHaveLength(1)
        expect(replaceVirtualCardById).not.toHaveBeenCalled()
    })

    it('fails when the request never left this process', async () => {
        pinelabsRequest.mockResolvedValue({ ok: false, error: 'AUTH_FAILED' })

        const result = await issue({ cardType: 'Virtual' })

        expect(result.ok).toBe(false)
        expect(failedWrites()).toHaveLength(1)
    })
})

describe('issueCardCore — confirmation', () => {
    it('marks ISSUED on responseCode 0 with a referenceNumber, and leaves the queue', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({
            responseCode: 0, referenceNumber: 8381581115, orderId: 51177, maskedCardNumber: '608363******1386', cardViewLink: 'https://view',
        }))

        const result = await issue({ cardType: 'Virtual' })

        expect(result.confirmed).toBe(true)
        const [, fields] = updateCardById.mock.calls[0]
        expect(fields.status).toBe('ISSUED')
        expect(fields.referenceNumber).toBe(8381581115)
        expect(fields.reconcileNextAt).toBeNull()
    })

    it('stores the PIN link the vendor actually sends (pinSetLink), which used to be dropped', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({
            responseCode: 0, referenceNumber: 1, pinSetLink: 'https://pin/set',
        }))

        await issue({ cardType: 'Physical', sourceCardIssuanceId: 10, sourceReferenceNumber: 111, shipping: { addressLine1: 'A1' } })

        expect(updateCardById.mock.calls[0][1].resetPinLink).toBe('https://pin/set')
    })

    it('hides the source virtual only on a confirmed physical, addressed by id', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({ responseCode: 0, referenceNumber: 6718937685 }))

        await issue({ cardType: 'Physical', sourceCardIssuanceId: 10, sourceReferenceNumber: 6718937685, shipping: { addressLine1: 'A1' } })

        expect(replaceVirtualCardById).toHaveBeenCalledWith(10)
    })
})

describe('issueCardCore — the duplicate guard', () => {
    it('refuses a second issuance while one is unresolved', async () => {
        findBlockingIssuance.mockResolvedValue({ id: 3, status: 'PENDING' })

        const result = await issue({ cardType: 'Virtual' })

        expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'PENDING', statusCode: 409 }))
        expect(pinelabsRequest).not.toHaveBeenCalled()
    })

    it('turns a lost INSERT race into a 409, not a 500 — the guard must close the TOCTOU window', async () => {
        const err = new Error('Validation error')
        err.name = 'SequelizeUniqueConstraintError'
        err.parent = { sqlMessage: `Duplicate entry 'V:99' for key 'cardIssuances.${ACTIVE_ISSUANCE_INDEX}'` }
        createCard.mockRejectedValue(err)

        const result = await issue({ cardType: 'Virtual' })

        expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'PENDING', statusCode: 409 }))
        expect(pinelabsRequest).not.toHaveBeenCalled()
    })

    it('rethrows an unrelated insert failure rather than reporting it as a duplicate', async () => {
        createCard.mockRejectedValue(new Error('connection lost'))

        await expect(issue({ cardType: 'Virtual' })).rejects.toThrow('connection lost')
    })

    it('enqueues the row in the INSERT itself, so a crash before the vendor call cannot orphan it', async () => {
        pinelabsRequest.mockResolvedValue(vendorTimeout())

        await issue({ cardType: 'Virtual' })

        expect(createCard).toHaveBeenCalledWith(expect.objectContaining({
            status: 'PENDING',
            reconcileNextAt: expect.anything(),
        }))
    })
})

describe('issueCardCore — spend controls in the INSERT', () => {
    // The caller applies these again after a confirmed issuance, but an UNCONFIRMED one returns before
    // that, so the INSERT is the only place they get written for a card that goes PENDING.
    it('persists the controls the admin entered, not just the card limit', async () => {
        pinelabsRequest.mockResolvedValue(vendorTimeout())

        await issue({
            cardType: 'Virtual',
            enforcedLimit: 5000,
            perTxnLimit: 1000,
            limitFrequency: 'weekly',
            atmEnabled: true,
            restrictedCategories: [{ category: 'Gambling', mccs: ['7995'] }],
        })

        expect(createCard).toHaveBeenCalledWith(expect.objectContaining({
            cardLimit: 5000,
            perTxnLimit: 1000,
            limitFrequency: 'weekly',
            atmEnabled: true,
            restrictedCategories: [{ category: 'Gambling', mccs: ['7995'] }],
        }))
    })

    it('leaves the columns at their defaults when no controls were supplied', async () => {
        pinelabsRequest.mockResolvedValue(vendorTimeout())

        await issue({ cardType: 'Virtual', enforcedLimit: 5000 })

        const fields = createCard.mock.calls[0][0]
        expect(fields).not.toHaveProperty('perTxnLimit')
        expect(fields).not.toHaveProperty('atmEnabled')
        expect(fields).not.toHaveProperty('restrictedCategories')
        expect(fields.limitFrequency).toBe('monthly')
    })
})

describe('issueCardCore — the vendor call', () => {
    it('bounds the issue POST with the configured timeout — virtual', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({ responseCode: 0, referenceNumber: 1 }))

        await issue({ cardType: 'Virtual' })

        expect(pinelabsRequest).toHaveBeenCalledWith(expect.objectContaining({
            path: '/v1/cards/digitals/orders/instant',
            timeout: 5000,
        }))
    })

    it('bounds the issue POST with the same timeout — virtual to physical', async () => {
        pinelabsRequest.mockResolvedValue(vendorOk({ responseCode: 0, referenceNumber: 1 }))

        await issue({ cardType: 'Physical', sourceCardIssuanceId: 10, sourceReferenceNumber: 111, shipping: { addressLine1: 'A1' } })

        expect(pinelabsRequest).toHaveBeenCalledWith(expect.objectContaining({
            path: '/v1/cards/digitals/physicals/instant',
            timeout: 5000,
        }))
    })
})

describe('issueCardCore — validation', () => {
    it('rejects an unrecognised card type instead of silently issuing a virtual card', async () => {
        const result = await issue({ cardType: 'physical' })

        expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_TYPE', statusCode: 400 }))
        expect(createCard).not.toHaveBeenCalled()
    })

    it('still refuses to issue to a cardholder whose KYC is incomplete', async () => {
        findByMobile.mockResolvedValue({ kycStatus: 'PENDING' })

        const result = await issue({ cardType: 'Virtual' })

        expect(result.reason).toBe('KYC_INCOMPLETE')
    })
})
