const { getUpComingDocExpiries } = require("../../cloud_dashboard");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const { humanReadableDate } = require("../../../../../utils/dateUtils");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({}));
jest.mock('../../../../../utils/dateUtils', () => ({
    humanReadableDate: jest.fn(),
}));

describe('getUpComingDocExpiries Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return upcoming document expiries within the specified days', async () => {
        const credentialId = 1;
        const within = 30;
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);

        const documents = [
            {
                documentName: 'Doc A',
                documentNumber: '123',
                documentType: 'Type A',
                documentCategory: 'ASSET',
                expireDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from today
                issueDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days before today
                cloud_asset: { assetName: 'Asset A' }
            },
            {
                documentName: 'Doc B',
                documentNumber: '456',
                documentType: 'Type B',
                documentCategory: 'FLEET',
                expireDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from today
                issueDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days before today
                cloud_fleet: { vehicleName: 'Fleet B' }
            }
        ];
        const expectedExpiries = [
            {
                documentName: 'Doc A',
                documentNumber: '123',
                documentType: 'Type A',
                documentCategory: 'ASSET',
                issueDate: humanReadableDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
                expireDate: humanReadableDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
                assetName: 'Asset A'
            }
        ];

        cloud_documents.findAll.mockResolvedValue(documents);
        humanReadableDate.mockImplementation((date) => {date.toDateString()}); // Mock date formatting

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual(expectedExpiries);
    });

    it('should return an empty array if there are no documents', async () => {
        const credentialId = 2;
        const within = 30;
        const documents = [];

        cloud_documents.findAll.mockResolvedValue(documents);

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual([]);
    });

    it('should return an empty array if there are no upcoming document expiries within the specified days', async () => {
        const credentialId = 3;
        const within = 30;
        const today = new Date();
        const documents = [
            {
                documentName: 'Doc C',
                documentNumber: '789',
                documentType: 'Type C',
                documentCategory: 'ASSET',
                expireDate: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000), // 31 days from today
                issueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before today
                cloud_asset: { assetName: 'Asset C' }
            }
        ];

        cloud_documents.findAll.mockResolvedValue(documents);

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual([]);
    });

    it('should exclude documents with no expireDate or null expireDate', async () => {
        const credentialId = 4;
        const within = 30;
        const today = new Date();
        const documents = [
            {
                documentName: 'Doc D',
                documentNumber: '101112',
                documentType: 'Type D',
                documentCategory: 'ASSET',
                expireDate: null,
                issueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before today
                cloud_asset: { assetName: 'Asset D' }
            },
            {
                documentName: 'Doc E',
                documentNumber: '131415',
                documentType: 'Type E',
                documentCategory: 'FLEET',
                expireDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from today
                issueDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days before today
                cloud_fleet: { vehicleName: 'Fleet E' }
            }
        ];

        cloud_documents.findAll.mockResolvedValue(documents);

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual([
            {
                documentName: 'Doc E',
                documentNumber: '131415',
                documentType: 'Type E',
                documentCategory: 'FLEET',
                issueDate: humanReadableDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
                expireDate: humanReadableDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
                vehicleName: 'Fleet E'
            }
        ]);
    });

    it('should handle cases where no documents match the criteria', async () => {
        const credentialId = 5;
        const within = 30;
        const today = new Date();
        const documents = [
            {
                documentName: 'Doc F',
                documentNumber: '161718',
                documentType: 'Type F',
                documentCategory: 'ASSET',
                expireDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days before today
                issueDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days before today
                cloud_asset: { assetName: 'Asset F' }
            }
        ];

        cloud_documents.findAll.mockResolvedValue(documents);

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual([]);
    });

    it('should handle errors when fetching documents', async () => {
        const credentialId = 6;
        const within = 30;
        const error = new Error('Database error');

        cloud_documents.findAll.mockRejectedValue(error);

        const result = await getUpComingDocExpiries(credentialId, null, within);

        expect(cloud_documents.findAll).toHaveBeenCalledWith({
            include: [
                { model: cloud_assets, attributes: ["id", "assetName"] },
                { model: cloud_fleets, attributes: ["id", "vehicleName"] }
            ],
            where: { credentialId: credentialId }
        });
        expect(result).toEqual(error);
    });
});
