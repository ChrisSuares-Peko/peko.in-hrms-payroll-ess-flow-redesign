const { updateApplicationStatus } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    findOne: jest.fn(),
}));

describe('updateApplicationStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('finds the application and updates it with the status data', async () => {
        const update = jest.fn().mockResolvedValue({ status: 'SUBMITTED' });
        businessRegistration.findOne.mockResolvedValue({ update });

        const result = await updateApplicationStatus('BR/2026/1', { status: 'SUBMITTED' });

        expect(businessRegistration.findOne).toHaveBeenCalledWith({
            where: { applicationId: 'BR/2026/1' },
        });
        expect(update).toHaveBeenCalledWith({ status: 'SUBMITTED' });
        expect(result).toEqual({ status: 'SUBMITTED' });
    });

    it('throws "Application not found" when the application is missing', async () => {
        businessRegistration.findOne.mockResolvedValue(null);
        await expect(updateApplicationStatus('missing', { status: 'X' })).rejects.toThrow(
            'Application not found'
        );
    });
});
