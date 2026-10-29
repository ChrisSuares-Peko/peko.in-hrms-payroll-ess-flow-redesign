const { Op } = require('sequelize');
const orders = require('../../../entities/order'); // Adjust the path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjust the path
const credential = require('../../../entities/credential'); // Adjust the path
const { findAllWorkspaceOrders } = require('../../transaction'); // Adjust the path

jest.mock('../../../entities/order');
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');

describe('findAllWorkspaceOrders', () => {
    it('should return workspace orders with valid parameters', async () => {
        // Mock data
        const mockParams = {
            start: 0,
            from: '2023-01-01',
            to: '2023-12-31',
            length: 10,
            searchText: 'test',
            order: 'ASC',
            column: 1, // 'credential.name' column
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    corporateTxnId: 'TXN123',
                    credential: { name: 'Corporate A' },
                    transactionDate: '2023-05-01',
                    amountInINR: 5000,
                    paymentMode: 'Online',
                    status: 'Completed',
                },
                {
                    id: 2,
                    corporateTxnId: 'TXN124',
                    credential: { name: 'Corporate B' },
                    transactionDate: '2023-06-01',
                    amountInINR: 7000,
                    paymentMode: 'Offline',
                    status: 'Pending',
                },
            ],
        };

        orders.findAndCountAll.mockResolvedValueOnce(mockResponse);

        const result = await findAllWorkspaceOrders(mockParams);

        // Assertions
        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: { serviceCategory: 'Workspaces' },
                },
                {
                    model: credential,
                    attributes: ['name'],
                },
            ],
            where: {
                transactionDate: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
                [Op.or]: [
                    { id: { [Op.like]: `%${mockParams.searchText}%` } },
                    { corporateTxnId: { [Op.like]: `%${mockParams.searchText}%` } },
                    { operatorId: { [Op.like]: `%${mockParams.searchText}%` } },
                    { amountInINR: { [Op.like]: `%${mockParams.searchText}%` } },
                    { baseAmount: { [Op.like]: `%${mockParams.searchText}%` } },
                    { baseCurrency: { [Op.like]: `%${mockParams.searchText}%` } },
                    { exchangeRate: { [Op.like]: `%${mockParams.searchText}%` } },
                    { status: { [Op.like]: `%${mockParams.searchText}%` } },
                    { paymentMode: { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${mockParams.searchText}%` } },
                    { message: { [Op.like]: `%${mockParams.searchText}%` } },
                ],
            },
            order: [['credential.name', 'ASC']],
            limit: mockParams.length,
            offset: mockParams.start,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResponse);
    });

    it('should handle missing parameters gracefully', async () => {
        // Mock Data
        const mockQuery = {
            limit: undefined,
            offset: undefined,
            order: undefined,
            where: {},
        };
    
        // Call the function
        await findAllWorkspaceOrders(mockQuery);
    
        // Assertions
        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: expect.any(Number),
                offset: expect.any(Number),
                order: expect.any(Array),
                where: expect.any(Object),
            })
        );
    });
    

    it('should handle Sequelize errors', async () => {
        const mockParams = {
            start: 0,
            from: '2023-01-01',
            to: '2023-12-31',
            length: 10,
            searchText: 'error',
            order: 'DESC',
            column: 3, // 'transactionDate' column
        };

        const mockError = new Error('Database error');
        orders.findAndCountAll.mockRejectedValueOnce(mockError);

        await expect(findAllWorkspaceOrders(mockParams)).rejects.toThrow(
            'Database error'
        );

        expect(orders.findAndCountAll).toHaveBeenCalled();
    });
});
