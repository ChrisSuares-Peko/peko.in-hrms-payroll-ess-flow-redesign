const { getUpComingChequeLeavesDues } = require("../../cloud_dashboard");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const { humanReadableDate } = require("../../../../../utils/dateUtils");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    findAll: jest.fn(),
}));

describe('getUpComingChequeLeavesDues Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return upcoming cheque leaves dues within the specified days', async () => {
        const credentialId = 1;
        const within = 30;
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);
        const chequeLeaves = [
            {
                payeeName: 'John Doe',
                chequeNumber: '123',
                dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from today
                status: 'Issued'
            },
            {
                payeeName: 'Jane Smith',
                chequeNumber: '456',
                dueDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from today
                status: 'Issued'
            }
        ];
        const expectedDues = [
            {
                payeeName: 'John Doe',
                chequeNumber: '123',
                dueDate: humanReadableDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
            }
        ];

        cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(expectedDues);
    });

    it('should return an empty array if there are no cheque leaves', async () => {
        const credentialId = 2;
        const within = 30;
        const chequeLeaves = [];

        cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should return an empty array if there are no upcoming dues within the specified days', async () => {
        const credentialId = 3;
        const within = 30;
        const today = new Date();
        const chequeLeaves = [
            {
                payeeName: 'John Doe',
                chequeNumber: '123',
                dueDate: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000), // 31 days from today
                status: 'Issued'
            }
        ];

        cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should exclude cheque leaves with status other than "Issued"', async () => {
        const credentialId = 4;
        const within = 30;
        const today = new Date();
        const chequeLeaves = [
            {
                payeeName: 'John Doe',
                chequeNumber: '123',
                dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
                status: 'Cancelled'
            }
        ];

        cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should handle cases where dueDate is null', async () => {
        const credentialId = 5;
        const within = 30;
       
        const chequeLeaves = [
            {
                payeeName: 'John Doe',
                chequeNumber: '123',
                dueDate: null,
                status: 'Issued'
            }
        ];

        cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should handle errors when fetching cheque leaves', async () => {
        const credentialId = 6;
        const within = 30;
        const error = new Error('Database error');

        cloud_chequeLeaves.findAll.mockRejectedValue(error);

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(error);
    });

    it('should handle unexpected errors gracefully', async () => {
        const credentialId = 7;
        const within = 30;

        cloud_chequeLeaves.findAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getUpComingChequeLeavesDues(credentialId, null, within);

        expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
