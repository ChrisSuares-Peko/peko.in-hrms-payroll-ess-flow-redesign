jest.mock('../../../utils/othersClient', () => ({ internalPost: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const { internalPost } = require('../../../utils/othersClient')
const { customLog } = require('../../../utils/loggerHelper')
const { createNotification } = require('../notification')

describe('createNotification', () => {
    beforeEach(() => jest.clearAllMocks())

    const data = {
        notificationTitle: 'Unfreeze Request',
        notificationBrief: 'A cardholder has submitted an unfreeze request for approval.',
        notificationCategory: 'UNFREEZE_REQUEST',
        notificationTo: 'corp-admin',
        notificationBy: 'CARDHOLDER',
    }

    it('routes through the others service internal API, since corporateCard has its own database', async () => {
        internalPost.mockResolvedValue({ id: 1 })
        const req = { LogTraceId: 'trace-1' }

        const result = await createNotification(data, req)

        expect(internalPost).toHaveBeenCalledWith('/notifications', data, { req })
        expect(result).toEqual({ id: 1 })
    })

    it('logs and returns null instead of throwing when the internal call fails', async () => {
        internalPost.mockRejectedValue(new Error('others unreachable'))
        const req = { LogTraceId: 'trace-1' }

        const result = await createNotification(data, req)

        expect(result).toBeNull()
        expect(customLog).toHaveBeenCalledWith('trace-1', 'error', expect.objectContaining({
            notificationCategory: 'UNFREEZE_REQUEST',
        }), 'CONSOLE')
    })
})
