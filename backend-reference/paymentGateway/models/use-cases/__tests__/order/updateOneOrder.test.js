const { updateOneOrder } = require('../../../use-cases/order'); 
const order = require('../../../entities/order'); 
const { customLog } = require('../../../../utils/loggerHelper');  

jest.mock('../../../entities/order', () => ({
    update: jest.fn(),
    findByPk: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
    customLog: jest.fn(),
}));

describe('updateOneOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the order and return the updated order when found', async () => {
        const mockCorporateTxnId = '12345';
        const mockParams = { status: 'SHIPPED' };
        const mockUpdatedOrder = { corporateTxnId: mockCorporateTxnId, status: 'SHIPPED' };

        order.update.mockResolvedValue([1]); // One row updated
        order.findByPk.mockResolvedValue(mockUpdatedOrder);

        const result = await updateOneOrder(mockCorporateTxnId, mockParams);

        expect(order.update).toHaveBeenCalledWith(mockParams, { where: { corporateTxnId: mockCorporateTxnId } });
        expect(order.findByPk).toHaveBeenCalledWith(mockCorporateTxnId);
        expect(result).toEqual(mockUpdatedOrder);
        expect(customLog).toHaveBeenCalledWith(null, "info", { message: "ORDER UPDATE ONE ROUTE CALLED" });
    });

    it('should return undefined if no order is updated', async () => {
        const mockCorporateTxnId = '12345';
        const mockParams = { status: 'SHIPPED' };

        order.update.mockResolvedValue([0]); // No rows updated

        const result = await updateOneOrder(mockCorporateTxnId, mockParams);

        expect(order.update).toHaveBeenCalledWith(mockParams, { where: { corporateTxnId: mockCorporateTxnId } });
        expect(order.findByPk).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
        expect(customLog).toHaveBeenCalledWith(null, "info", { message: "ORDER UPDATE ONE ROUTE CALLED" });
    });


    it('should handle errors during database operations (update)', async () => {
        const mockCorporateTxnId = '12345';
        const mockParams = { status: 'SHIPPED' };
        const mockError = new Error('Database error');

        order.update.mockRejectedValue(mockError);
        const consoleLogSpy = jest.spyOn(console, 'log');

        const result = await updateOneOrder(mockCorporateTxnId, mockParams);

        expect(order.update).toHaveBeenCalledWith(mockParams, { where: { corporateTxnId: mockCorporateTxnId } });
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(customLog).toHaveBeenCalledWith(null, "info", { message: "ORDER UPDATE ONE ROUTE CALLED" });
        expect(result).toBe(false);

        consoleLogSpy.mockRestore();
    });

    it('should handle errors during database operations (findByPk)', async () => {
        const mockCorporateTxnId = '12345';
        const mockParams = { status: 'SHIPPED' };
        const mockError = new Error('Database error');

        order.update.mockResolvedValue([1]);
        order.findByPk.mockRejectedValue(mockError);
        const consoleLogSpy = jest.spyOn(console, 'log');

        const result = await updateOneOrder(mockCorporateTxnId, mockParams);

        expect(order.update).toHaveBeenCalledWith(mockParams, { where: { corporateTxnId: mockCorporateTxnId } });
        expect(order.findByPk).toHaveBeenCalledWith(mockCorporateTxnId);
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(customLog).toHaveBeenCalledWith(null, "info", { message: "ORDER UPDATE ONE ROUTE CALLED" });
        expect(result).toBe(false);

        consoleLogSpy.mockRestore();
    });
});