const { createBBPSWebhooks } = require('../../support');
const messages = require('../../../entities/support');

jest.mock('../../../entities/support');

describe('createBBPSWebhooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a BBPS webhook and append to history', async () => {
        const mockSupport = {
            getDataValue: jest.fn().mockReturnValue([]),
            setDataValue: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        };
        messages.findOne.mockResolvedValue(mockSupport);

        const webhookData = { status: 'SUCCESS', refId: 'REF001' };
        const result = await createBBPSWebhooks('BBPS001', webhookData);

        expect(messages.findOne).toHaveBeenCalledWith({ where: { bbpsSupportRefId: 'BBPS001' } });
        expect(mockSupport.getDataValue).toHaveBeenCalledWith('bbpsSupportHistory');
        expect(mockSupport.setDataValue).toHaveBeenCalledWith('bbpsSupportHistory', [webhookData]);
        expect(mockSupport.save).toHaveBeenCalled();
        expect(result).toEqual(mockSupport);
    });

    it('should append to existing history', async () => {
        const existingHistory = [{ status: 'PENDING' }];
        const mockSupport = {
            getDataValue: jest.fn().mockReturnValue(existingHistory),
            setDataValue: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        };
        messages.findOne.mockResolvedValue(mockSupport);

        const newData = { status: 'SUCCESS' };
        await createBBPSWebhooks('BBPS001', newData);

        expect(mockSupport.setDataValue).toHaveBeenCalledWith('bbpsSupportHistory', [
            { status: 'PENDING' },
            { status: 'SUCCESS' },
        ]);
    });

    it('should throw error if support not found', async () => {
        messages.findOne.mockResolvedValue(null);

        await expect(createBBPSWebhooks('BBPS_NOTFOUND', {})).rejects.toThrow('Support not found');
    });

    it('should throw error on DB failure', async () => {
        messages.findOne.mockRejectedValue(new Error('DB error'));

        await expect(createBBPSWebhooks('BBPS001', {})).rejects.toThrow('DB error');
    });
});
