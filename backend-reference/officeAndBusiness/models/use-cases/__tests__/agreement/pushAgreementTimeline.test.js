const { pushAgreementTimeline } = require('../../agreement');
const agreement = require('../../../entities/agreement');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));

describe('pushAgreementTimeline', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should append event to an existing timeline', async () => {
        const existing = [{ eventName: 'CREATED', createdAt: new Date() }];
        const mockDoc = { timeline: existing, update: jest.fn().mockResolvedValue(true) };
        agreement.findOne.mockResolvedValue(mockDoc);

        await pushAgreementTimeline(1, 'SENT');

        expect(mockDoc.update).toHaveBeenCalledWith({
            timeline: expect.arrayContaining([
                expect.objectContaining({ eventName: 'CREATED' }),
                expect.objectContaining({ eventName: 'SENT' }),
            ]),
        });
    });

    it('should start a new timeline when existing timeline is null', async () => {
        const mockDoc = { timeline: null, update: jest.fn().mockResolvedValue(true) };
        agreement.findOne.mockResolvedValue(mockDoc);

        await pushAgreementTimeline(1, 'SIGNED');

        expect(mockDoc.update).toHaveBeenCalledWith({
            timeline: [expect.objectContaining({ eventName: 'SIGNED' })],
        });
    });

    it('should return null when agreement is not found', async () => {
        agreement.findOne.mockResolvedValue(null);

        const result = await pushAgreementTimeline(999, 'SENT');

        expect(result).toBeNull();
    });

    it('should throw an error if database call fails', async () => {
        agreement.findOne.mockRejectedValue(new Error('Database error'));

        await expect(pushAgreementTimeline(1, 'SENT')).rejects.toThrow('Database error');
    });
});
