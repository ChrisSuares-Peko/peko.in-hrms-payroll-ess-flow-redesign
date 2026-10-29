const { getUpComingOwnersDocExpiries } = require("../../cloud_dashboard");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");
const { humanReadableDate } = require("../../../../../utils/dateUtils");

jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../../../utils/dateUtils', () => ({
    humanReadableDate: jest.fn(),
}));

describe('getUpComingOwnersDocExpiries Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return upcoming owner document expiries within the specified days', async () => {
        const credentialId = 1;
        const within = 30;
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);
        const owners = [
            {
                dataValues: {
                    ownerName: 'John Doe',
                    passport: { expireDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000) }, // 15 days from today
                    visa: { expireDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000) }, // 45 days from today
                    insurance: null,
                    ejari: null,
                    emiratesId: { expireDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) } // 10 days from today
                }
            },
            {
                dataValues: {
                    ownerName: 'Jane Smith',
                    passport: { expireDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000) }, // 60 days from today
                    visa: null,
                    insurance: { expireDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) }, // 5 days from today
                    ejari: null,
                    emiratesId: null
                }
            }
        ];
        const expectedExpiries = [
            {
                ownerName: 'John Doe',
                documentType: 'Passport',
                expireDate: (new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)).toDateString(),
            },
            {
                ownerName: 'John Doe',
                documentType: 'Emirates ID',
                expireDate: (new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)).toDateString(),
            },
            {
                ownerName: 'Jane Smith',
                documentType: 'Insurance',
                expireDate: (new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)).toDateString(),
            }
        ];

        cloud_owners.findAll.mockResolvedValue(owners);
        humanReadableDate.mockImplementation((date) => date.toDateString()); // Mock date formatting

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(expectedExpiries);
    });

    it('should return an empty array if there are no owners', async () => {
        const credentialId = 2;
        const within = 30;
        const owners = [];

        cloud_owners.findAll.mockResolvedValue(owners);

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should return an empty array if there are no upcoming document expiries within the specified days', async () => {
        const credentialId = 3;
        const within = 30;
        const today = new Date();
        const owners = [
            {
                dataValues: {
                    ownerName: 'John Doe',
                    passport: { expireDate: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000) }, // 31 days from today
                    visa: null,
                    insurance: null,
                    ejari: null,
                    emiratesId: null
                }
            }
        ];

        cloud_owners.findAll.mockResolvedValue(owners);

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should exclude documents with no expireDate or null expireDate', async () => {
        const credentialId = 4;
        const within = 30;
        const today = new Date();
        const owners = [
            {
                dataValues: {
                    ownerName: 'John Doe',
                    passport: { expireDate: null },
                    visa: { expireDate: null },
                    insurance: { expireDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000) },
                    ejari: { expireDate: null },
                    emiratesId: { expireDate: null }
                }
            }
        ];

        cloud_owners.findAll.mockResolvedValue(owners);

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([
            {
                ownerName: 'John Doe',
                documentType: 'Insurance',
                expireDate: humanReadableDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
            }
        ]);
    });

    it('should handle cases where no documents match the criteria', async () => {
        const credentialId = 5;
        const within = 30;
        
        const owners = [
            {
                dataValues: {
                    ownerName: 'John Doe',
                    passport: { expireDate: null },
                    visa: { expireDate: null },
                    insurance: { expireDate: null },
                    ejari: { expireDate: null },
                    emiratesId: { expireDate: null }
                }
            }
        ];

        cloud_owners.findAll.mockResolvedValue(owners);

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual([]);
    });

    it('should handle errors when fetching owners', async () => {
        const credentialId = 6;
        const within = 30;
        const error = new Error('Database error');

        cloud_owners.findAll.mockRejectedValue(error);

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(error);
    });

    it('should handle unexpected errors gracefully', async () => {
        const credentialId = 7;
        const within = 30;

        cloud_owners.findAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getUpComingOwnersDocExpiries(credentialId, null, within);

        expect(cloud_owners.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
