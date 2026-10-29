const { findAllFleetDocs } = require("../../cloud_fleetDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require('sequelize');

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllFleetDocs Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return documents with pagination, sorting, and filtering', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'Doc';
        const fleetId = 1;

        const documentsData = {
            count: 2,
            rows: [
                { id: 1, documentName: 'Doc1', documentNumber: '12345', documentType: 'Type1' },
                { id: 2, documentName: 'Doc2', documentNumber: '67890', documentType: 'Type2' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFleetDocs(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: 'FLEET',
                cloudFleetId: fleetId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with pagination and sorting but no filtering', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'DESC';
        const searchText = '';
        const fleetId = null;

        const documentsData = {
            count: 3,
            rows: [
                { id: 1, documentName: 'Doc1', documentNumber: '12345', documentType: 'Type1' },
                { id: 2, documentName: 'Doc2', documentNumber: '67890', documentType: 'Type2' },
                { id: 3, documentName: 'Doc3', documentNumber: '54321', documentType: 'Type3' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFleetDocs(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                documentCategory: 'FLEET',
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with pagination, sorting, and fleet ID filtering', async () => {
        const page = 2;
        const itemsPerPage = 5;
        const sortField = 'createdAt';
        const sort = 'ASC';
        const searchText = '';
        const fleetId = 2;

        const documentsData = {
            count: 4,
            rows: [
                { id: 6, documentName: 'Doc6', documentNumber: '98765', documentType: 'Type6' },
                { id: 7, documentName: 'Doc7', documentNumber: '43210', documentType: 'Type7' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFleetDocs(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                documentCategory: 'FLEET',
                cloudFleetId: fleetId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return error if database query fails', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = '';
        const fleetId = null;

        cloud_documents.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFleetDocs(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle cases with no documents found', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'NonExisting';
        const fleetId = 1;

        const documentsData = {
            count: 0,
            rows: [],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFleetDocs(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: 'FLEET',
                cloudFleetId: fleetId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });
});
