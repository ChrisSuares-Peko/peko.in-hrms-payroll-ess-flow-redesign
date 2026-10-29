const { getAllDocuments } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('getAllDocuments Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return paginated documents and total count', async () => {
        const params = {
            corporateUserID: 'corporateUserID',
            limit: 10,
            searchText: 'document',
            page: 1,
            fullName: 'John Doe',
        };

        const mockEmployees = [
            {
                _id: 'employeeId1',
                fullName: 'John Doe',
                createdAt: new Date('2023-07-10'),
                employeeDocuments: [
                    {
                        _id: 'docId1',
                        name: 'Document 1',
                        url: 'http://example.com/doc1',
                        expiryDate: new Date('2023-12-31'),
                        holderName: 'John Doe',
                    },
                ],
            },
            {
                _id: 'employeeId2',
                fullName: 'Jane Smith',
                createdAt: new Date('2023-07-15'),
                employeeDocuments: [
                    {
                        _id: 'docId2',
                        name: 'Document 2',
                        url: 'http://example.com/doc2',
                        expiryDate: new Date('2023-12-31'),
                        holderName: 'Jane Smith',
                    },
                ],
            },
        ];

        Employee.aggregate.mockResolvedValue(mockEmployees);

        const result = await getAllDocuments(params);

        expect(Employee.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    isEmployeeDeleted: false,
                    corporateUser: params.corporateUserID,
                    $or: [
                        { 'employeeDocuments.name': { $regex: params.searchText, $options: 'i' } },
                        { fullName: { $regex: params.searchText, $options: 'i' } },
                    ],
                    'personalInformation.fullName': { $regex: params.fullName, $options: 'i' },
                },
            },
            { $unwind: '$employeeDocuments' },
            {
                $match: {
                    $or: [
                        { 'employeeDocuments.name': { $regex: params.searchText, $options: 'i' } },
                        { fullName: { $regex: params.searchText, $options: 'i' } },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    fullName: '$personalInformation.fullName',
                    createdAt: 1,
                    'employeeDocuments.name': 1,
                    'employeeDocuments.url': 1,
                    'employeeDocuments.expiryDate': 1,
                    'employeeDocuments.holderName': 1,
                    'employeeDocuments._id': 1,
                },
            },
            {
                $group: {
                    _id: '$_id',
                    fullName: { $first: '$fullName' },
                    createdAt: { $first: '$createdAt' },
                    employeeDocuments: {
                        $push: {
                            name: '$employeeDocuments.name',
                            url: '$employeeDocuments.url',
                            expiryDate: '$employeeDocuments.expiryDate',
                            holderName: '$employeeDocuments.holderName',
                            _id: '$employeeDocuments._id',
                        },
                    },
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        expect(result).toEqual({
            documents: [
                {
                    _id: 'docId1',
                    name: 'Document 1',
                    url: 'http://example.com/doc1',
                    expiryDate: new Date('2023-12-31'),
                    holderName: 'John Doe',
                    createdAt: new Date('2023-07-10'),
                    fullName: 'John Doe',
                    employeeId: 'employeeId1',
                },
                {
                    _id: 'docId2',
                    name: 'Document 2',
                    url: 'http://example.com/doc2',
                    expiryDate: new Date('2023-12-31'),
                    holderName: 'Jane Smith',
                    createdAt: new Date('2023-07-15'),
                    fullName: 'Jane Smith',
                    employeeId: 'employeeId2',
                },
            ],
            total: 2,
        });
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'corporateUserID',
            limit: 10,
            searchText: 'document',
            page: 1,
            fullName: 'John Doe',
        };

        const errorMessage = 'Database error';
        Employee.aggregate.mockRejectedValue(new Error(errorMessage));

        await expect(getAllDocuments(params)).rejects.toThrow(errorMessage);
    });
});
