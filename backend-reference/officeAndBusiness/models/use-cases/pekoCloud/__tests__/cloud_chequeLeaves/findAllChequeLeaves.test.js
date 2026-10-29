const { findAllChequeLeaves } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllChequeLeaves Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully find all cheque leaves with pagination and sorting', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'chequeNumber';
        const sort = 'ASC';
        const searchText = 'test';
        const credentialId = 1;
        const chequeBookId = 2;
        const subCorporateUserId = 3;
        const offset = (page - 1) * itemsPerPage;
        const chequeLeavesData = { count: 5, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeaves(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            chequeBookId,
            subCorporateUserId
        );

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { type: { [Op.like]: `%${searchText}%` } },
                    { payeeName: { [Op.like]: `%${searchText}%` } },
                    { chequeBookNumber: { [Op.like]: `%${searchText}%` } },
                    { bankAccount: { [Op.like]: `%${searchText}%` } },
                    { signedBy: { [Op.like]: `%${searchText}%` } },
                    { chequeNumber: { [Op.like]: `%${searchText}%` } },
                ],
                cloudChequeBookId: chequeBookId,
                subCorporateUserId,
            },
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should successfully find all cheque leaves with no filters and default pagination and sorting', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'id';
        const sort = 'ASC';
        const chequeLeavesData = { count: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeaves(
            page,
            itemsPerPage,
            sortField,
            sort,
            null,
            null,
            null,
            null
        );

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: 0,
            order: [[sortField, sort]],
            where: {},
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should handle empty search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'id';
        const sort = 'ASC';
        const searchText = '';
        const chequeLeavesData = { count: 2, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeaves(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            null,
            null,
            null
        );

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: 0,
            order: [[sortField, sort]],
            where: {},
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should handle unexpected errors', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'id';
        const sort = 'ASC';
        const searchText = 'error';

        cloud_chequeLeaves.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await findAllChequeLeaves(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            null,
            null,
            null
        );

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
