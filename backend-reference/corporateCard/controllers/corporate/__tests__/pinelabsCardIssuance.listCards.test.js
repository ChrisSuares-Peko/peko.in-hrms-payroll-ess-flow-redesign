jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    safeAudit: jest.fn(),
    attachCardholders: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../utils/pinelabsGateway', () => ({ pinelabsRequest: jest.fn(), isPinelabsSuccess: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({ searchCardUserIds: jest.fn() }))
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
jest.mock('../../../models/use-cases/cardTransaction', () => ({ getSpendByCard: jest.fn() }))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    findTerminationStatusByCardIds: jest.fn(),
    findOpenRequestStatusByCardIds: jest.fn(),
    findActiveTerminateCardIds: jest.fn(),
}))
jest.mock('../../../services/cardSlotReservation', () => ({
    CardSlotError: class extends Error {},
    reservePhysicalCardSlot: jest.fn(),
}))

const { findAndCountCardsWithHolder } = require('../../../models/use-cases/cardIssuance')
const { getSpendByCard } = require('../../../models/use-cases/cardTransaction')
const {
    findTerminationStatusByCardIds,
    findOpenRequestStatusByCardIds,
    findActiveTerminateCardIds,
} = require('../../../models/use-cases/cardRequest')
const { listCards } = require('../pinelabsCardIssuance')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (user, query = {}) => {
    const res = buildRes()
    const next = jest.fn()
    return listCards({ user, query, params: {} }, res, next).then(() => ({ res, next }))
}

describe('exports.listCards scoping', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findAndCountCardsWithHolder.mockResolvedValue({ count: 0, rows: [] })
        getSpendByCard.mockResolvedValue(new Map())
        findTerminationStatusByCardIds.mockResolvedValue(new Map())
        findOpenRequestStatusByCardIds.mockResolvedValue(new Map())
        findActiveTerminateCardIds.mockResolvedValue([])
    })

    it('refuses a session that is neither admin nor cardholder, without querying any card', async () => {
        const { next } = await run({ role: 'USER', corporateId: 42, employeeId: 'abc' })

        expect(findAndCountCardsWithHolder).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cardholder context is missing.' }))
    })

    it('refuses a session with no corporate context', async () => {
        const { next } = await run({ role: 'USER', employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] })

        expect(findAndCountCardsWithHolder).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
    })

    it('pins a cardholder to their own userId, ignoring a query override', async () => {
        await run({ role: 'USER', corporateId: 42, employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] }, { userId: '7' })

        expect(findAndCountCardsWithHolder).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, cardholder: { userId: '99' } })
        )
    })

    it('lets an admin omit userId to see the whole corporate', async () => {
        await run({ role: 'CORPORATE', corporateId: 42 })

        expect(findAndCountCardsWithHolder).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, cardholder: undefined })
        )
    })

    it('lets an admin narrow to one cardholder via ?userId', async () => {
        await run({ role: 'CORPORATE', corporateId: 42 }, { userId: '7' })

        expect(findAndCountCardsWithHolder).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, cardholder: { userId: '7' } })
        )
    })
})
